import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DB_CONNECTION, type Database } from '../../db';
import { announcements, employees } from '../../db/schema';
import { eq, desc, and, like, or, lt } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { CreateAnnouncementDto, UpdateAnnouncementDto, AnnouncementQueryDto, AnnouncementCursorPage } from './dto/announcement.dto';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys } from '../../common/cache/cache-keys';
import { NotificationService } from '../notifications/notifications.service';
import { NotificationModule, NotificationCategory } from '../notifications/types/notification.types';

@Injectable()
export class AnnouncementsService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
    private readonly notificationService: NotificationService,
  ) {}

  // ─── Cursor-based pagination ─────────────────────────────────────────────

  async findAllCursor(query: AnnouncementQueryDto): Promise<AnnouncementCursorPage> {
    const { cursor, limit = 20, status = 'all', search } = query;

    // Decode cursor if provided
    let cursorDate: Date | null = null;
    let cursorId: string | null = null;
    if (cursor) {
      try {
        const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
        const [timestamp, id] = decoded.split(':');
        cursorDate = new Date(parseInt(timestamp, 10));
        cursorId = id;
      } catch {
        // Invalid cursor, ignore
      }
    }

    // Build cache key from query params
    const cacheKeyParts = `${cursor || ''}:${limit}:${status}:${search || ''}`;
    const cached = await this.cache.getByKey<AnnouncementCursorPage>(
      CacheKeys.announcementCursorPage,
      cacheKeyParts,
    );
    if (cached) return cached;

    // Build conditions
    const conditions = [];

    // Status filter
    if (status !== 'all') {
      conditions.push(eq(announcements.status, status));
    }

    // Search filter
    if (search) {
      conditions.push(
        or(
          like(announcements.title, `%${search}%`),
          like(announcements.content, `%${search}%`),
          like(announcements.authorName, `%${search}%`),
        )!,
      );
    }

    // Cursor filter (get items AFTER the cursor)
    if (cursorDate && cursorId) {
      const cursorDateStr = cursorDate.toISOString().split('T')[0]; // YYYY-MM-DD
      conditions.push(
        or(
          lt(announcements.date, cursorDateStr),
          and(
            eq(announcements.date, cursorDateStr),
            lt(announcements.id, cursorId),
          ),
        )!,
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch limit + 1 to determine if there's a next page
    const results = await this.db
      .select()
      .from(announcements)
      .where(where)
      .orderBy(desc(announcements.date), desc(announcements.createdAt))
      .limit(limit + 1);

    // Determine if there's a next page
    const hasNextPage = results.length > limit;
    const data = results.slice(0, limit);

    // Generate next cursor from last item
    let nextCursor: string | null = null;
    if (hasNextPage && data.length > 0) {
      const lastItem = data[data.length - 1];
      const lastDate = new Date(lastItem.date);
      const cursorValue = `${lastDate.getTime()}:${lastItem.id}`;
      nextCursor = Buffer.from(cursorValue).toString('base64');
    }

    // Format dates
    const formatted = data.map(ann => ({
      ...ann,
      date: new Date(ann.date).toISOString().split('T')[0],
    }));

    const page: AnnouncementCursorPage = {
      data: formatted,
      nextCursor,
      hasNextPage,
      limit,
    };

    // Cache the page
    await this.cache.setByKey(CacheKeys.announcementCursorPage, page, cacheKeyParts);
    return page;
  }

  // ─── Legacy method (keep for backward compatibility) ──────────────────────

  async findAll() {
    const cached = await this.cache.getByKey(CacheKeys.announcementList);
    if (cached) return cached;

    const results = await this.db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.date), desc(announcements.createdAt));
    
    // Format date string for frontend to be consistently 'YYYY-MM-DD'
    const formatted = results.map(ann => ({
      ...ann,
      date: new Date(ann.date).toISOString().split('T')[0]
    }));

    await this.cache.setByKey(CacheKeys.announcementList, formatted);
    return formatted;
  }

  async findOne(id: string) {
    const cached = await this.cache.getByKey(CacheKeys.announcementById, id);
    if (cached) return cached;

    const result = await this.db
      .select()
      .from(announcements)
      .where(eq(announcements.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    const formatted = {
      ...result[0],
      date: new Date(result[0].date).toISOString().split('T')[0]
    };

    await this.cache.setByKey(CacheKeys.announcementById, formatted, id);
    return formatted;
  }

  async create(createDto: CreateAnnouncementDto) {
    const today = new Date().toISOString().split('T')[0];
    const newAnn = await this.db
      .insert(announcements)
      .values({
        title: createDto.title,
        content: createDto.content,
        category: createDto.category,
        department: createDto.department,
        status: createDto.status,
        authorId: createDto.authorId || null,
        authorName: createDto.authorName || 'HR Admin',
        date: today,
      })
      .returning();

    const formatted = {
      ...newAnn[0],
      date: new Date(newAnn[0].date).toISOString().split('T')[0]
    };

    await this.invalidateCache();

    if (newAnn[0].status === 'Published') {
      await this.triggerBroadcastNotification(newAnn[0]);
    }

    return formatted;
  }

  async update(id: string, updateDto: UpdateAnnouncementDto) {
    // First verify exists
    const existing: any = await this.findOne(id);

    const updatedAnn = await this.db
      .update(announcements)
      .set(updateDto)
      .where(eq(announcements.id, id))
      .returning();

    const formatted = {
      ...updatedAnn[0],
      date: new Date(updatedAnn[0].date).toISOString().split('T')[0]
    };

    await this.invalidateCache(id);

    if (updatedAnn[0].status === 'Published' && existing.status !== 'Published') {
      await this.triggerBroadcastNotification(updatedAnn[0]);
    }

    return formatted;
  }

  private async triggerBroadcastNotification(ann: any) {
    try {
      const activeEmployees = await this.db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.status, 'active'));

      await this.notificationService.emitBulk(
        activeEmployees.map((emp) => ({
          recipientId: emp.id,
          actorId: ann.authorId || null,
          module: NotificationModule.ANNOUNCEMENTS,
          category: NotificationCategory.BROADCAST,
          title: `New Announcement: ${ann.title}`,
          message: `A new announcement has been published by ${ann.authorName || 'HR'}.`,
          actionUrl: '/announcements',
          entityType: 'announcement',
          entityId: ann.id,
        })),
      );
    } catch (err: any) {
      // Don't fail the operation if notification fails
    }
  }

  async remove(id: string) {
    // First verify exists
    await this.findOne(id);

    await this.db.delete(announcements).where(eq(announcements.id, id));
    
    await this.invalidateCache(id);
    return { success: true, message: 'Announcement deleted successfully' };
  }

  // ─── Cache invalidation ──────────────────────────────────────────────────

  private async invalidateCache(id?: string) {
    const promises: Promise<void>[] = [
      this.cache.delByPattern(CacheKeys.announcementList),
    ];
    if (id) {
      promises.push(this.cache.delByKey(CacheKeys.announcementById, id));
    }
    await Promise.all(promises);
  }
}
