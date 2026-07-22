import { Logger, Inject } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/cache/cache.service';
import { NOTIFICATION_QUEUE, NotificationService } from './notifications.service';
import { DB_CONNECTION } from '../../db';
import type { Database } from '../../db';
import { notifications } from '../../db/schema/notifications';
import { and, eq, lt } from 'drizzle-orm';
import { NotificationModule, NotificationCategory, NotificationPriority } from './types/notification.types';

@Processor(NOTIFICATION_QUEUE, { concurrency: 5 })
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly notificationService: NotificationService,
    @Inject(DB_CONNECTION) private readonly db: Database,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing notification job: ${job.name} (job ID: ${job.id})`);

    try {
      if (job.name === 'delayed-delivery') {
        const dto = job.data;
        this.logger.log(`Executing delayed notification delivery for recipient: ${dto.recipientId}`);
        return await this.notificationService.emit(dto, true);
      }

      if (job.name === 'cleanup-expired') {
        this.logger.log('Executing background notification cleanup and archiving...');
        return await this.runCleanup();
      }

      if (job.name === 'digest') {
        const dto = job.data;
        this.logger.log(`Pushing rate-limited notification to digest queue for recipient: ${dto.recipientId}`);
        await this.redis.rpush(`notif:digest:${dto.recipientId}`, JSON.stringify(dto));
        // Keep TTL of digest queue to 7 days
        await this.redis.expire(`notif:digest:${dto.recipientId}`, 604800);
        return { status: 'queued_for_digest' };
      }

      if (job.name === 'send-digests') {
        this.logger.log('Processing consolidated notification digests...');
        return await this.sendDigests();
      }

      this.logger.warn(`Unknown notification job name: ${job.name}`);
      return { status: 'ignored' };
    } catch (err: any) {
      this.logger.error(`Failed to process notification job ${job.name}: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Run auto-archiving of expired notifications and purge archived notifications older than 90 days
   */
  private async runCleanup() {
    const now = new Date();
    
    // 1. Auto-archive notifications past expires_at
    const archivedResult = await this.db
      .update(notifications)
      .set({
        isArchived: true,
        updatedAt: now,
      })
      .where(
        and(
          eq(notifications.isArchived, false),
          lt(notifications.expiresAt, now)
        )
      );

    // 2. Hard purge archived notifications older than 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const deletedResult = await this.db
      .delete(notifications)
      .where(
        and(
          eq(notifications.isArchived, true),
          lt(notifications.createdAt, ninetyDaysAgo)
        )
      );

    return {
      archivedCount: archivedResult.length,
      deletedCount: deletedResult.length,
    };
  }

  /**
   * Consolidate and emit daily digests for users who had rate-limited notifications.
   * Uses SCAN instead of KEYS to avoid blocking Redis in production.
   */
  private async sendDigests(): Promise<any> {
    const keys: string[] = [];
    const stream = this.redis.scanStream({ match: 'notif:digest:*', count: 100 });

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (batch: string[]) => keys.push(...batch));
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    let processedUsersCount = 0;

    for (const key of keys) {
      const recipientId = key.replace('notif:digest:', '');
      const items = await this.redis.lrange(key, 0, -1);
      
      if (items.length > 0) {
        // Clear list
        await this.redis.del(key);
        const dtos = items.map((item) => JSON.parse(item));
        processedUsersCount++;

        // Compile titles summary
        const titles = dtos.map((d) => d.title).join(', ');
        const truncatedTitles = titles.length > 150 ? `${titles.substring(0, 147)}...` : titles;

        await this.notificationService.emit(
          {
            recipientId,
            module: NotificationModule.ANNOUNCEMENTS,
            category: NotificationCategory.SYSTEM, // Using SYSTEM as it is a system-generated summary digest
            priority: NotificationPriority.NORMAL,
            title: 'Daily Notification Digest',
            message: `You missed ${dtos.length} notifications: ${truncatedTitles}`,
          },
          true, // Bypass preferences/rate limiting for direct digest delivery
        );
      }
    }

    return { processedUsersCount };
  }
}
