import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DB_CONNECTION, type Database } from '../../db';
import { announcements } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/announcement.dto';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys } from '../../common/cache/cache-keys';

@Injectable()
export class AnnouncementsService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
  ) {}

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
    return formatted;
  }

  async update(id: string, updateDto: UpdateAnnouncementDto) {
    // First verify exists
    await this.findOne(id);

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
    return formatted;
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
