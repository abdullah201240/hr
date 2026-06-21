import { Injectable, Inject, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { eq, and, desc, lt, gt, count } from 'drizzle-orm';
import Redis from 'ioredis';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { REDIS_CLIENT } from '../../common/cache/cache.service';
import { DB_CONNECTION } from '../../db';
import type { Database } from '../../db';
import { notifications } from '../../db/schema/notifications';
import { employees } from '../../db/schema/employee';
import { EmitNotificationDto } from './dto/emit-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationGateway } from './notifications.gateway';
import { DeduplicationGuard } from './guards/deduplication.guard';
import { NotificationRateLimiter } from './guards/rate-limiter.guard';
import { PreferencesService } from './services/preferences.service';
import { NotificationModule, NotificationCategory } from './types/notification.types';

export const NOTIFICATION_QUEUE = 'notifications';

@Injectable()
export class NotificationService implements OnModuleInit {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    @InjectQueue(NOTIFICATION_QUEUE) private readonly queue: Queue,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly gateway: NotificationGateway,
    private readonly dedup: DeduplicationGuard,
    private readonly rateLimiter: NotificationRateLimiter,
    private readonly preferences: PreferencesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  async onModuleInit() {
    // Register repeatable cleanup-expired job (Daily at midnight)
    await this.queue.add(
      'cleanup-expired',
      {},
      {
        repeat: { pattern: '0 0 * * *' },
        jobId: 'cleanup-expired-daily',
      },
    );

    // Register repeatable send-digests job (Daily at 8 AM)
    await this.queue.add(
      'send-digests',
      {},
      {
        repeat: { pattern: '0 8 * * *' },
        jobId: 'send-digests-daily',
      },
    );
  }

  // ─── Emit Pipeline ──────────────────────────────────────────────

  /**
   * Main pipeline to emit a notification to a user.
   * flow: dedup -> preferences -> rate limit -> persist -> websocket push
   */
  async emit(dto: EmitNotificationDto, bypassPreferences = false): Promise<any | null> {
    // 1. Deduplication guard check
    const shouldEmit = await this.dedup.shouldEmit(dto);
    if (!shouldEmit) {
      return null;
    }

    // 2. User preferences check
    if (!bypassPreferences) {
      const pref = await this.preferences.shouldDeliver(dto.recipientId, dto);
      if (!pref.deliver) {
        if (pref.reason === 'quiet_hours' && pref.deliverAt) {
          // Queue notification for delivery after quiet hours end
          const delayMs = pref.deliverAt.getTime() - Date.now();
          await this.queue.add('delayed-delivery', dto, { delay: delayMs });
        }
        return null;
      }
    }

    // 3. Rate limiting check
    const canDeliver = await this.rateLimiter.canDeliver(dto.recipientId, dto.priority || 'normal');
    if (!canDeliver) {
      // Direct into daily/hourly digest queue
      await this.queue.add('digest', dto);
      return null;
    }

    // 4. Mark deduplication key
    await this.dedup.markEmitted(dto);

    // 5. Persist with unique key violation handling
    let notification: any;
    try {
      const [inserted] = await this.db
        .insert(notifications)
        .values({
          recipientId: dto.recipientId,
          actorId: dto.actorId || null,
          module: dto.module,
          category: dto.category,
          priority: dto.priority || 'normal',
          title: dto.title,
          message: dto.message,
          entityType: dto.entityType || null,
          entityId: dto.entityId || null,
          actionUrl: dto.actionUrl || null,
          actions: dto.actions || null,
          metadata: dto.metadata || null,
          dedupKey: this.dedup.resolveDedupKey(dto),
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          isRead: false,
          isArchived: false,
        })
        .returning();
      notification = inserted;
    } catch (dbErr: any) {
      if (dbErr.code === '23505' || dbErr.message?.includes('unique') || dbErr.message?.includes('duplicate')) {
        return null;
      }
      throw dbErr;
    }

    // Increment unread count in Redis
    await this.redis.incr(`notif:unread:${dto.recipientId}`);

    // 6. WebSocket real-time delivery
    await this.gateway.publishSyncEvent('NEW_NOTIFICATION', dto.recipientId, notification);

    return notification;
  }

  /**
   * Bulk notifications delivery wrapper
   */
  async emitBulk(dtos: EmitNotificationDto[]): Promise<void> {
    const chunkSize = 50;
    for (let i = 0; i < dtos.length; i += chunkSize) {
      const chunk = dtos.slice(i, i + chunkSize);
      await Promise.all(chunk.map((dto) => this.emit(dto).catch(() => null)));
    }
  }

  // ─── CRUD Operations ─────────────────────────────────────────────

  /**
   * Paginated find with filters
   */
  async findAll(recipientId: string, query: NotificationQueryDto) {
    const limit = query.limit || 20;
    const isReadBool = query.isRead !== undefined ? query.isRead === 'true' : undefined;
    const isArchivedBool = query.isArchived !== undefined ? query.isArchived === 'true' : false; // Default false

    let conditions: any[] = [eq(notifications.recipientId, recipientId)];

    if (query.module) {
      conditions.push(eq(notifications.module, query.module));
    }
    if (query.category) {
      conditions.push(eq(notifications.category, query.category));
    }
    if (isReadBool !== undefined) {
      conditions.push(eq(notifications.isRead, isReadBool));
    }
    if (isArchivedBool !== undefined) {
      conditions.push(eq(notifications.isArchived, isArchivedBool));
    }
    if (query.priority) {
      conditions.push(eq(notifications.priority, query.priority));
    }
    if (query.cursor) {
      conditions.push(lt(notifications.createdAt, new Date(query.cursor)));
    }

    const list = await this.db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit + 1); // Select one extra to determine if nextCursor exists

    let hasMore = false;
    let data = [...list];
    if (list.length > limit) {
      hasMore = true;
      data = list.slice(0, limit);
    }

    const nextCursor = hasMore ? data[data.length - 1].createdAt.toISOString() : null;

    // Fetch unread count for helper
    const unreadCount = await this.getUnreadCount(recipientId);

    return {
      data,
      nextCursor,
      unreadCount,
    };
  }

  /**
   * Get total unread count for user (Redis-first with DB fallback)
   */
  async getUnreadCount(recipientId: string): Promise<number> {
    const cached = await this.redis.get(`notif:unread:${recipientId}`);
    if (cached !== null) {
      return parseInt(cached, 10);
    }

    const [result] = await this.db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, recipientId),
          eq(notifications.isRead, false),
          eq(notifications.isArchived, false),
        )
      );

    const countVal = result?.count || 0;
    await this.redis.setex(`notif:unread:${recipientId}`, 3600, countVal.toString());
    return countVal;
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(id: string, recipientId: string) {
    const [notification] = await this.db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.recipientId, recipientId)));

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.isRead) {
      return notification;
    }

    const [updated] = await this.db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notifications.id, id))
      .returning();

    // Decrement unread counter in Redis
    const current = await this.redis.get(`notif:unread:${recipientId}`);
    if (current && parseInt(current, 10) > 0) {
      await this.redis.decr(`notif:unread:${recipientId}`);
    } else {
      await this.redis.set(`notif:unread:${recipientId}`, '0');
    }

    await this.gateway.publishSyncEvent('NOTIFICATION_READ', recipientId, {
      id,
      readAt: updated.readAt?.toISOString(),
    });

    return updated;
  }

  /**
   * Mark all unread notifications as read
   */
  async markAllAsRead(recipientId: string) {
    const now = new Date();
    await this.db
      .update(notifications)
      .set({
        isRead: true,
        readAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(notifications.recipientId, recipientId),
          eq(notifications.isRead, false),
          eq(notifications.isArchived, false),
        )
      );

    await this.redis.set(`notif:unread:${recipientId}`, '0');

    await this.gateway.publishSyncEvent('NOTIFICATION_MARK_ALL_READ', recipientId, {
      readAt: now.toISOString(),
    });

    return { success: true };
  }

  /**
   * Archive a single notification
   */
  async archive(id: string, recipientId: string) {
    const [notification] = await this.db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.recipientId, recipientId)));

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const [updated] = await this.db
      .update(notifications)
      .set({
        isArchived: true,
        updatedAt: new Date(),
      })
      .where(eq(notifications.id, id))
      .returning();

    // If it was unread, decrement unread count
    if (!notification.isRead) {
      const current = await this.redis.get(`notif:unread:${recipientId}`);
      if (current && parseInt(current, 10) > 0) {
        await this.redis.decr(`notif:unread:${recipientId}`);
      }
    }

    await this.gateway.publishSyncEvent('NOTIFICATION_ARCHIVED', recipientId, { id });

    return updated;
  }

  /**
   * Archive all read notifications
   */
  async archiveAllRead(recipientId: string) {
    await this.db
      .update(notifications)
      .set({
        isArchived: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notifications.recipientId, recipientId),
          eq(notifications.isRead, true),
          eq(notifications.isArchived, false),
        )
      );

    return { success: true };
  }

  /**
   * Hard delete a notification
   */
  async delete(id: string, recipientId: string) {
    const [notification] = await this.db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.recipientId, recipientId)));

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.db
      .delete(notifications)
      .where(eq(notifications.id, id));

    if (!notification.isRead && !notification.isArchived) {
      const current = await this.redis.get(`notif:unread:${recipientId}`);
      if (current && parseInt(current, 10) > 0) {
        await this.redis.decr(`notif:unread:${recipientId}`);
      }
    }

    await this.gateway.publishSyncEvent('NOTIFICATION_DELETED', recipientId, { id });

    return { success: true };
  }

  /**
   * Execute a quick-action API call locally using recipient identity context
   */
  async executeAction(notificationId: string, actionIndex: number, userId: string): Promise<any> {
    const [notification] = await this.db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, notificationId), eq(notifications.recipientId, userId)));

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const actions = notification.actions || [];
    const action = actions[actionIndex];

    if (!action) {
      throw new NotFoundException('Action index not found');
    }

    if (notification.metadata?.actionTaken) {
      throw new BadRequestException('An action has already been executed on this notification');
    }

    // 1. Fetch recipient context to execute authorization flow
    const [employee] = await this.db
      .select()
      .from(employees)
      .where(eq(employees.id, userId));

    if (!employee) {
      throw new NotFoundException('Executing employee context not found');
    }

    // 2. Generate local JWT payload
    const token = this.jwtService.sign(
      { sub: employee.id, email: employee.email, role: employee.role },
      { secret: this.configService.get<string>('jwt.accessTokenSecret') }
    );

    // 3. Make internal local HTTP request in-process using Fastify Adapter
    const instance = this.httpAdapterHost.httpAdapter.getInstance();

    try {
      const response = await instance.inject({
        method: action.apiMethod,
        url: `/api${action.apiUrl}`,
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${token}`,
        },
        payload: action.apiBody || undefined,
      });

      const success = response.statusCode >= 200 && response.statusCode < 300;
      let responseBody: any = null;
      try {
        responseBody = typeof response.json === 'function' ? response.json() : JSON.parse(response.body);
      } catch {
        responseBody = { status: response.statusCode, statusText: response.statusMessage };
      }

      if (success) {
        // Update notification metadata
        const updatedMetadata = {
          ...(notification.metadata || {}),
          actionTaken: action.label,
          actionAt: new Date().toISOString(),
          actionResponse: responseBody,
        };

        await this.db
          .update(notifications)
          .set({
            metadata: updatedMetadata,
            isRead: true,
            readAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(notifications.id, notificationId));

        await this.gateway.publishSyncEvent('NOTIFICATION_ACTION_RESULT', userId, {
          notificationId,
          actionIndex,
          success: true,
          actionTaken: action.label,
          metadata: updatedMetadata,
        });

        return { success: true, response: responseBody };
      } else {
        await this.gateway.publishSyncEvent('NOTIFICATION_ACTION_RESULT', userId, {
          notificationId,
          actionIndex,
          success: false,
          error: responseBody,
        });
        return { success: false, error: responseBody };
      }

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await this.gateway.publishSyncEvent('NOTIFICATION_ACTION_RESULT', userId, {
        notificationId,
        actionIndex,
        success: false,
        error: errMsg,
      });
      return { success: false, error: errMsg };
    }
  }

  /**
   * Expose helper to fetch all employee IDs for broadcasting (Issue 4)
   */
  async getAllEmployeeIds(): Promise<string[]> {
    const list = await this.db.select({ id: employees.id }).from(employees);
    return list.map((e) => e.id);
  }

  /**
   * Helper to retrieve recent unread notifications for reconnection sync (Issue 6)
   */
  async getRecentUnread(recipientId: string, limit = 50) {
    return this.db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, recipientId),
          eq(notifications.isRead, false),
          eq(notifications.isArchived, false),
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }
}
