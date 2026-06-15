import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DB_CONNECTION, type Database } from '../../db';
import { announcements } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(@Inject(DB_CONNECTION) private readonly db: Database) {}

  async findAll() {
    const results = await this.db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.date), desc(announcements.createdAt));
    
    // Format date string for frontend to be consistently 'YYYY-MM-DD'
    return results.map(ann => ({
      ...ann,
      date: new Date(ann.date).toISOString().split('T')[0]
    }));
  }

  async findOne(id: string) {
    const result = await this.db
      .select()
      .from(announcements)
      .where(eq(announcements.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    return {
      ...result[0],
      date: new Date(result[0].date).toISOString().split('T')[0]
    };
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

    return {
      ...newAnn[0],
      date: new Date(newAnn[0].date).toISOString().split('T')[0]
    };
  }

  async update(id: string, updateDto: UpdateAnnouncementDto) {
    // First verify exists
    await this.findOne(id);

    const updatedAnn = await this.db
      .update(announcements)
      .set(updateDto)
      .where(eq(announcements.id, id))
      .returning();

    return {
      ...updatedAnn[0],
      date: new Date(updatedAnn[0].date).toISOString().split('T')[0]
    };
  }

  async remove(id: string) {
    // First verify exists
    await this.findOne(id);

    await this.db.delete(announcements).where(eq(announcements.id, id));
    return { success: true, message: 'Announcement deleted successfully' };
  }
}
