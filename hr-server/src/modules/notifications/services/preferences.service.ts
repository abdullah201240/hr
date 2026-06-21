import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../common/cache/cache.service';
import { DB_CONNECTION } from '../../../db';
import type { Database } from '../../../db';
import { notificationPreferences } from '../../../db/schema/notifications';
import { EmitNotificationDto } from '../dto/emit-notification.dto';
import { NotificationPriority } from '../types/notification.types';

@Injectable()
export class PreferencesService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Fetch preferences for user. Uses cache first. If no record exists, creates one.
   */
  async getPreferences(employeeId: string): Promise<any> {
    const cacheKey = `notif:prefs:${employeeId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    let [prefs] = await this.db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.employeeId, employeeId));

    if (!prefs) {
      [prefs] = await this.db
        .insert(notificationPreferences)
        .values({
          employeeId,
          disabledModules: [],
          disabledCategories: [],
          emailEnabled: false,
          pushEnabled: true,
          digestFrequency: 'realtime',
        })
        .returning();
    }

    await this.redis.setex(cacheKey, 300, JSON.stringify(prefs)); // Cache for 5 mins
    return prefs;
  }

  /**
   * Invalidate cached user preferences
   */
  async invalidateCache(employeeId: string): Promise<void> {
    await this.redis.del(`notif:prefs:${employeeId}`);
  }

  /**
   * Save user preferences
   */
  async updatePreferences(employeeId: string, data: any): Promise<any> {
    const [updated] = await this.db
      .update(notificationPreferences)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(notificationPreferences.employeeId, employeeId))
      .returning();

    await this.invalidateCache(employeeId);
    return updated;
  }

  /**
   * Check if a notification should be delivered based on recipient preferences
   */
  async shouldDeliver(
    recipientId: string,
    dto: EmitNotificationDto,
  ): Promise<{
    deliver: boolean;
    reason?: 'muted_module' | 'muted_category' | 'quiet_hours';
    deliverAt?: Date;
  }> {
    // Urgent priority always bypasses preferences
    if (dto.priority === NotificationPriority.URGENT) {
      return { deliver: true };
    }

    const prefs = await this.getPreferences(recipientId);

    // 1. Module disabled
    if (prefs.disabledModules.includes(dto.module)) {
      return { deliver: false, reason: 'muted_module' };
    }

    // 2. Category disabled
    if (prefs.disabledCategories.includes(dto.category)) {
      return { deliver: false, reason: 'muted_category' };
    }

    // 3. Quiet hours check
    if (prefs.quietHoursStart && prefs.quietHoursEnd) {
      const { isQuiet, deliverAt } = this.checkQuietHours(
        prefs.quietHoursStart,
        prefs.quietHoursEnd,
      );
      if (isQuiet) {
        return { deliver: false, reason: 'quiet_hours', deliverAt };
      }
    }

    return { deliver: true };
  }

  /**
   * Internal helper to determine if we are inside a quiet hours window
   */
  private checkQuietHours(start: string, end: string): { isQuiet: boolean; deliverAt?: Date } {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);

    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;

    let isQuiet = false;
    let deliverAt: Date | undefined;

    if (startMinutes < endMinutes) {
      // Quiet hours in same day (e.g. 09:00 - 17:00)
      isQuiet = currentMinutes >= startMinutes && currentMinutes < endMinutes;
      if (isQuiet) {
        deliverAt = new Date(now);
        deliverAt.setHours(eh, em, 0, 0);
      }
    } else {
      // Quiet hours over midnight (e.g. 22:00 - 07:00)
      isQuiet = currentMinutes >= startMinutes || currentMinutes < endMinutes;
      if (isQuiet) {
        deliverAt = new Date(now);
        if (currentMinutes >= startMinutes) {
          deliverAt.setDate(deliverAt.getDate() + 1);
        }
        deliverAt.setHours(eh, em, 0, 0);
      }
    }

    return { isQuiet, deliverAt };
  }
}
