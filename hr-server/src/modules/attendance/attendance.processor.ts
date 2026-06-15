import { Injectable, Inject, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { eq, and, isNull, isNotNull, lte, gte, or } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import { attendanceLogs, holidays, employees } from '../../db/schema';
import { ATTENDANCE_QUEUE } from '../queue/queue.module';
import { AttendanceService } from './attendance.service';
import { AttendanceSettingsService } from '../attendance-settings/attendance-settings.service';

@Processor(ATTENDANCE_QUEUE, { concurrency: 1 })
export class AttendanceProcessor extends WorkerHost {
  private readonly logger = new Logger(AttendanceProcessor.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly attendanceService: AttendanceService,
    private readonly settingsService: AttendanceSettingsService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing attendance job: ${job.name} (job: ${job.id})`);

    try {
      if (job.name === 'initialize-daily-attendance') {
        return await this.initializeDaily();
      }

      if (job.name === 'auto-checkout-attendance') {
        return await this.autoCheckout();
      }

      this.logger.warn(`Unknown job name: ${job.name}`);
      return { status: 'ignored' };
    } catch (err: any) {
      this.logger.error(`Failed to process job ${job.name}: ${err.message}`, err.stack);
      throw err;
    }
  }

  // ─── Initialize Daily Logs ────────────────────────────────────────────────
  private async initializeDaily() {
    const todayStr = this.attendanceService.getLocalTodayStr();
    const today = new Date();
    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = DAY_NAMES[today.getDay()];

    this.logger.log(`Running daily attendance initialization for date: ${todayStr}`);

    // 1. Check if logs are already generated for today
    const existing = await this.db
      .select({ id: attendanceLogs.id })
      .from(attendanceLogs)
      .where(eq(attendanceLogs.date, todayStr))
      .limit(1);

    if (existing.length > 0) {
      this.logger.log(`Attendance logs already exist for today (${todayStr}) — skipping initialization`);
      return { status: 'skipped', reason: 'already_initialized' };
    }

    // 2. Load active employees, settings (cached), and holidays
    const [activeEmployees, settings, holiday] = await Promise.all([
      this.db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.status, 'active')),
      this.settingsService.getSettings(),
      this.db
        .select({ name: holidays.name })
        .from(holidays)
        .where(
          and(
            lte(holidays.startDate, todayStr),
            gte(holidays.endDate, todayStr), // startDate <= today <= endDate
          ),
        )
        .limit(1),
    ]);

    const weeklyHolidays = settings.weeklyHolidays || ['Saturday', 'Sunday'];

    // 3. Determine today's default status
    let defaultStatus = 'absent';
    let notes: string | null = null;

    if (holiday[0]) {
      defaultStatus = 'holiday';
      notes = holiday[0].name;
    } else if (weeklyHolidays.includes(dayName)) {
      defaultStatus = 'weekend';
    }

    if (activeEmployees.length === 0) {
      this.logger.log('No active employees found to initialize attendance logs');
      return { status: 'success', count: 0 };
    }

    // 4. Chunked batch insert (200 per chunk to avoid large SQL statements)
    const CHUNK_SIZE = 200;
    for (let i = 0; i < activeEmployees.length; i += CHUNK_SIZE) {
      const chunk = activeEmployees.slice(i, i + CHUNK_SIZE);
      await this.db.insert(attendanceLogs).values(
        chunk.map((emp) => ({
          employeeId: emp.id,
          date: todayStr,
          status: defaultStatus,
          notes,
        })),
      );
    }

    this.logger.log(
      `Successfully initialized ${activeEmployees.length} attendance logs for today as status "${defaultStatus}"`,
    );
    return { status: 'success', count: activeEmployees.length, defaultStatus };
  }

  // ─── Auto Check-Out ───────────────────────────────────────────────────────
  private async autoCheckout() {
    const todayStr = this.attendanceService.getLocalTodayStr();
    const now = new Date();

    this.logger.log(`Running auto-checkout self-healing worker scan`);

    // 1. Get office settings (cached)
    const settings = await this.settingsService.getSettings();

    // 2. Find logs where checkIn is not null, checkout is null, and date <= todayStr
    //    Select only needed columns to reduce memory/bandwidth
    const activeLogs = await this.db
      .select({
        id: attendanceLogs.id,
        employeeId: attendanceLogs.employeeId,
        date: attendanceLogs.date,
        checkIn: attendanceLogs.checkIn,
        notes: attendanceLogs.notes,
      })
      .from(attendanceLogs)
      .where(
        and(
          isNotNull(attendanceLogs.checkIn),
          isNull(attendanceLogs.checkOut),
          lte(attendanceLogs.date, todayStr),
        ),
      );

    if (activeLogs.length === 0) {
      this.logger.log('No active attendance sessions found requiring auto-checkout');
      return { status: 'success', processed: 0 };
    }

    let processedCount = 0;

    // Group logs by date for batched updates (same date shares same office end time)
    const byDate = new Map<string, typeof activeLogs>();
    for (const log of activeLogs) {
      const group = byDate.get(log.date) ?? [];
      group.push(log);
      byDate.set(log.date, group);
    }

    for (const [dateStr, logs] of byDate) {
      const officeEnd = this.attendanceService.parseOfficeTime(settings.endTime, dateStr);
      const isPastDay = dateStr < todayStr;
      const isPastOutTime = now >= officeEnd;

      if (!(isPastDay || isPastOutTime)) continue;

      const officeEndStr = this.attendanceService.formatTime(officeEnd);

      // Compute break hours once per date group (same break window for all)
      let breakHours = 0;
      if (settings.breakStart && settings.breakEnd) {
        const breakS = this.attendanceService.parseOfficeTime(settings.breakStart, dateStr);
        const breakE = this.attendanceService.parseOfficeTime(settings.breakEnd, dateStr);
        if (officeEnd > breakS) {
          // Will be narrowed per-log below if needed
        }
      }

      // Update each log individually (different check-in times → different hours)
      for (const log of logs) {
        this.logger.log(
          `Auto-checking out employee ${log.employeeId} for date ${log.date} (check-in: ${log.checkIn})`,
        );

        const checkInTime = this.attendanceService.parseTimeString(log.checkIn!, log.date);

        // Compute hours
        const diffMs = officeEnd.getTime() - checkInTime.getTime();
        const totalHours = diffMs / (1000 * 60 * 60);

        let logBreakHours = 0;
        if (settings.breakStart && settings.breakEnd) {
          const breakS = this.attendanceService.parseOfficeTime(settings.breakStart, dateStr);
          const breakE = this.attendanceService.parseOfficeTime(settings.breakEnd, dateStr);
          if (checkInTime < breakE && officeEnd > breakS) {
            const overlapStart = new Date(Math.max(checkInTime.getTime(), breakS.getTime()));
            const overlapEnd = new Date(Math.min(officeEnd.getTime(), breakE.getTime()));
            logBreakHours = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60);
          }
        }

        const finalHours = Math.max(0, Math.round((totalHours - logBreakHours) * 100) / 100);

        await this.db
          .update(attendanceLogs)
          .set({
            checkOut: officeEndStr,
            hours: finalHours,
            breakHours: Math.round(logBreakHours * 100) / 100,
            notes: log.notes
              ? `${log.notes} (Auto checked-out)`
              : 'Auto checked-out at end of shift',
          })
          .where(eq(attendanceLogs.id, log.id));

        processedCount++;
      }
    }

    this.logger.log(`Auto-checkout completed: processed ${processedCount} logs`);
    return { status: 'success', processed: processedCount };
  }
}
