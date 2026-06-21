import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { eq, asc } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import { attendanceSettings, holidays } from '../../db/schema';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys } from '../../common/cache/cache-keys';
import type {
  UpdateAttendanceSettingsDto,
  CreateHolidayDto,
  UpdateHolidayDto,
} from './dto/attendance-settings.dto';

/** Singleton row ID for the attendance_settings table */
const SINGLETON_ID = 'default';

@Injectable()
export class AttendanceSettingsService {
  private readonly logger = new Logger(AttendanceSettingsService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
  ) {}

  // ─── Get Settings (singleton) ────────────────────────────────────────────

  async getSettings() {
    const cached = await this.cache.getByKey<typeof attendanceSettings.$inferSelect>(
      CacheKeys.attendanceSettings,
    );
    if (cached) return cached;

    let [settings] = await this.db
      .select()
      .from(attendanceSettings)
      .where(eq(attendanceSettings.id, SINGLETON_ID))
      .limit(1);

    // Auto-create the singleton row if it doesn't exist yet
    if (!settings) {
      [settings] = await this.db
        .insert(attendanceSettings)
        .values({ id: SINGLETON_ID })
        .returning();
      this.logger.log('Initialized default attendance settings');
    }

    await this.cache.setByKey(CacheKeys.attendanceSettings, settings);
    return settings;
  }

  // ─── Update Settings ─────────────────────────────────────────────────────

  async updateSettings(dto: UpdateAttendanceSettingsDto) {
    return this.db.transaction(async (tx) => {
      // Ensure singleton exists
      const [existing] = await tx
        .select()
        .from(attendanceSettings)
        .where(eq(attendanceSettings.id, SINGLETON_ID))
        .limit(1);

      if (!existing) {
        // Create with defaults + overrides
        const [created] = await tx
          .insert(attendanceSettings)
          .values({ id: SINGLETON_ID, ...dto })
          .returning();
        await this.invalidateCache();
        this.logger.log('Attendance settings created with defaults');
        return created;
      }

      const updateData: Record<string, any> = {};
      if (dto.startTime !== undefined) updateData.startTime = dto.startTime;
      if (dto.endTime !== undefined) updateData.endTime = dto.endTime;
      if (dto.breakStart !== undefined) updateData.breakStart = dto.breakStart;
      if (dto.breakEnd !== undefined) updateData.breakEnd = dto.breakEnd;
      if (dto.lateThreshold !== undefined)
        updateData.lateThreshold = dto.lateThreshold;
      if (dto.halfDayThreshold !== undefined)
        updateData.halfDayThreshold = dto.halfDayThreshold;
      if (dto.weeklyHolidays !== undefined)
        updateData.weeklyHolidays = dto.weeklyHolidays;
      if (dto.lateRules !== undefined)
        updateData.lateRules = dto.lateRules;
      if (dto.twoStepLeaveThresholdDays !== undefined)
        updateData.twoStepLeaveThresholdDays = dto.twoStepLeaveThresholdDays;

      const [updated] = await tx
        .update(attendanceSettings)
        .set(updateData)
        .where(eq(attendanceSettings.id, SINGLETON_ID))
        .returning();

      await this.invalidateCache();
      this.logger.log('Attendance settings updated');
      return updated;
    });
  }

  // ─── Holidays CRUD ───────────────────────────────────────────────────────

  async getHolidays() {
    const cached = await this.cache.getByKey<any>(CacheKeys.holidaysList);
    if (cached) return cached;

    const list = await this.db
      .select()
      .from(holidays)
      .orderBy(asc(holidays.startDate));

    await this.cache.setByKey(CacheKeys.holidaysList, list);
    return list;
  }

  async createHoliday(dto: CreateHolidayDto) {
    const [holiday] = await this.db
      .insert(holidays)
      .values({
        name: dto.name,
        startDate: dto.startDate,
        endDate: dto.endDate,
      })
      .returning();

    await this.cache.delByPattern(CacheKeys.holidaysList);
    await this.cache.delByPattern(CacheKeys.attendanceLogsByMonth);
    this.logger.log(`Holiday created: ${holiday.name}`);
    return holiday;
  }

  async updateHoliday(id: string, dto: UpdateHolidayDto) {
    const [existing] = await this.db
      .select()
      .from(holidays)
      .where(eq(holidays.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Holiday with ID "${id}" not found`);
    }

    const updateData: Record<string, any> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.startDate !== undefined) updateData.startDate = dto.startDate;
    if (dto.endDate !== undefined) updateData.endDate = dto.endDate;

    const [updated] = await this.db
      .update(holidays)
      .set(updateData)
      .where(eq(holidays.id, id))
      .returning();

    await this.cache.delByPattern(CacheKeys.holidaysList);
    await this.cache.delByPattern(CacheKeys.attendanceLogsByMonth);
    this.logger.log(`Holiday updated: ${updated.name}`);
    return updated;
  }

  async deleteHoliday(id: string) {
    const [existing] = await this.db
      .select()
      .from(holidays)
      .where(eq(holidays.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Holiday with ID "${id}" not found`);
    }

    await this.db.delete(holidays).where(eq(holidays.id, id));

    await this.cache.delByPattern(CacheKeys.holidaysList);
    await this.cache.delByPattern(CacheKeys.attendanceLogsByMonth);
    this.logger.log(`Holiday deleted: ${existing.name}`);
    return { message: `Holiday "${existing.name}" has been deleted` };
  }

  // ─── Cache invalidation ──────────────────────────────────────────────────

  private async invalidateCache() {
    await this.cache.delByPattern(CacheKeys.attendanceSettings);
    await this.cache.delByPattern(CacheKeys.attendanceLogsByMonth);
  }
}
