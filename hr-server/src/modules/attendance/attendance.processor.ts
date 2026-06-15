import { Injectable, Inject, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { eq, and, isNull, isNotNull, lte, gte, or } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import { attendanceLogs, attendanceSettings, holidays, employees } from '../../db/schema';
import { ATTENDANCE_QUEUE } from '../queue/queue.module';
import { AttendanceService } from './attendance.service';

@Processor(ATTENDANCE_QUEUE, { concurrency: 1 })
export class AttendanceProcessor extends WorkerHost {
  private readonly logger = new Logger(AttendanceProcessor.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly attendanceService: AttendanceService,
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

    // 2. Load active employees, settings, and holidays
    const [activeEmployees, [settings], holiday] = await Promise.all([
      this.db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.status, 'active')),
      this.db.select().from(attendanceSettings).limit(1),
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

    const weeklyHolidays = settings?.weeklyHolidays || ['Saturday', 'Sunday'];

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

    // 4. Batch insert
    await this.db.insert(attendanceLogs).values(
      activeEmployees.map((emp) => ({
        employeeId: emp.id,
        date: todayStr,
        status: defaultStatus,
        notes,
      })),
    );

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

    // 1. Get office settings
    let [settings] = await this.db.select().from(attendanceSettings).limit(1);
    if (!settings) {
      settings = {
        id: 'default',
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '13:00',
        breakEnd: '14:00',
        lateThreshold: 15,
        halfDayThreshold: 240,
        weeklyHolidays: ['Saturday', 'Sunday'],
      };
    }

    // 2. Find logs where checkIn is not null, checkout is null, and date <= todayStr
    const activeLogs = await this.db
      .select()
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

    for (const log of activeLogs) {
      // Compare current datetime with this log's office out time
      const officeEnd = this.attendanceService.parseOfficeTime(settings.endTime, log.date);

      // Trigger auto checkout if:
      // - The log date is in the past (e.g. yesterday, always check out!)
      // - OR the log date is today and the current server time is past officeEnd
      const isPastDay = log.date < todayStr;
      const isPastOutTime = now >= officeEnd;

      if (isPastDay || isPastOutTime) {
        this.logger.log(
          `Auto-checking out employee ${log.employeeId} for date ${log.date} (check-in: ${log.checkIn})`,
        );

        // Convert endTime ("18:00") to AM/PM string ("06:00 PM")
        const officeEndStr = this.attendanceService.formatTime(officeEnd);
        const checkInTime = this.attendanceService.parseTimeString(log.checkIn!, log.date);

        // Compute hours
        const diffMs = officeEnd.getTime() - checkInTime.getTime();
        const totalHours = diffMs / (1000 * 60 * 60);

        let breakHours = 0;
        if (settings.breakStart && settings.breakEnd) {
          const breakS = this.attendanceService.parseOfficeTime(settings.breakStart, log.date);
          const breakE = this.attendanceService.parseOfficeTime(settings.breakEnd, log.date);
          if (checkInTime < breakE && officeEnd > breakS) {
            const overlapStart = new Date(Math.max(checkInTime.getTime(), breakS.getTime()));
            const overlapEnd = new Date(Math.min(officeEnd.getTime(), breakE.getTime()));
            breakHours = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60);
          }
        }

        const finalHours = Math.max(0, Math.round((totalHours - breakHours) * 100) / 100);

        await this.db
          .update(attendanceLogs)
          .set({
            checkOut: officeEndStr,
            hours: finalHours,
            breakHours: Math.round(breakHours * 100) / 100,
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
