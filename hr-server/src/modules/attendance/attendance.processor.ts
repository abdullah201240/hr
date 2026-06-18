import { Inject, Logger } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { eq, and, isNull, isNotNull, lte, gte, inArray } from 'drizzle-orm';
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
    @InjectQueue(ATTENDANCE_QUEUE) private readonly attendanceQueue: Queue,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing attendance job: ${job.name} (job: ${job.id})`);

    try {
      if (job.name === 'initialize-daily-attendance') {
        return await this.initializeDaily();
      }

      if (job.name === 'auto-checkin-attendance') {
        return await this.autoCheckIn(job);
      }

      if (job.name === 'auto-checkout-attendance') {
        return await this.autoCheckout(job);
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

    // 5. Schedule delayed jobs for auto-checkin and auto-checkout if it's a regular workday
    if (defaultStatus === 'absent') {
      const officeStart = this.attendanceService.parseOfficeTime(settings.startTime, todayStr);
      const officeEnd = this.attendanceService.parseOfficeTime(settings.endTime, todayStr);
      const nowMs = today.getTime();

      const delayStart = officeStart.getTime() - nowMs;
      const delayEnd = officeEnd.getTime() - nowMs;

      if (delayStart > 0) {
        await this.attendanceQueue.add(
          'auto-checkin-attendance',
          { date: todayStr },
          { delay: delayStart, removeOnComplete: true, removeOnFail: true }
        );
        this.logger.log(`Scheduled exact auto-checkin job for ${todayStr} at ${settings.startTime}`);
      }

      if (delayEnd > 0) {
        await this.attendanceQueue.add(
          'auto-checkout-attendance',
          { date: todayStr },
          { delay: delayEnd, removeOnComplete: true, removeOnFail: true }
        );
        this.logger.log(`Scheduled exact auto-checkout job for ${todayStr} at ${settings.endTime}`);
      }
    }

    return { status: 'success', count: activeEmployees.length, defaultStatus };
  }

  // ─── Auto Check-In ──────────────────────────────────────────────────────
  private async autoCheckIn(job?: Job) {
    const todayStr = job?.data?.date || this.attendanceService.getLocalTodayStr();
    this.logger.log(`Running precise auto-checkin worker scan for target date ${todayStr}`);

    // 1. Get office settings (cached) to format the exact time string
    const settings = await this.settingsService.getSettings();
    const officeStart = this.attendanceService.parseOfficeTime(settings.startTime, todayStr);
    const checkInStr = this.attendanceService.formatTime(officeStart);

    // 2. Find today's logs with no check-in and status = 'absent'
    const unCheckedLogs = await this.db
      .select({
        id: attendanceLogs.id,
        employeeId: attendanceLogs.employeeId,
      })
      .from(attendanceLogs)
      .where(
        and(
          eq(attendanceLogs.date, todayStr),
          isNull(attendanceLogs.checkIn),
          eq(attendanceLogs.status, 'absent'),
        ),
      );

    if (unCheckedLogs.length === 0) {
      this.logger.log('No employees need auto check-in at this time');
      return { status: 'success', processed: 0 };
    }

    const logIds = unCheckedLogs.map((log) => log.id);
    this.logger.log(`Auto-checking in ${logIds.length} employees for date ${todayStr}`);

    await this.db
      .update(attendanceLogs)
      .set({
        checkIn: checkInStr,
        status: 'present',
        notes: 'Auto checked-in at office start time',
      })
      .where(inArray(attendanceLogs.id, logIds));

    this.logger.log(`Auto-checkin completed: processed ${logIds.length} employees`);
    return { status: 'success', processed: logIds.length };
  }

  // ─── Auto Check-Out ───────────────────────────────────────────────────────
  private async autoCheckout(job?: Job) {
    const todayStr = job?.data?.date || this.attendanceService.getLocalTodayStr();
    this.logger.log(`Running precise auto-checkout worker scan for target date ${todayStr}`);

    // 1. Get office settings (cached)
    const settings = await this.settingsService.getSettings();

    // 2. Find logs where checkIn is not null, checkout is null, and date <= todayStr
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

    await this.db.transaction(async (tx) => {
      const promises = activeLogs.map(async (log) => {
        const officeEnd = this.attendanceService.parseOfficeTime(settings.endTime, log.date);
        const officeEndStr = this.attendanceService.formatTime(officeEnd);

        this.logger.log(
          `Auto-checking out employee ${log.employeeId} for date ${log.date} (check-in: ${log.checkIn})`,
        );

        const checkInTime = this.attendanceService.parseTimeString(log.checkIn!, log.date);

        // Compute hours
        const diffMs = officeEnd.getTime() - checkInTime.getTime();
        const totalHours = diffMs / (1000 * 60 * 60);

        let logBreakHours = 0;
        if (settings.breakStart && settings.breakEnd) {
          const breakS = this.attendanceService.parseOfficeTime(settings.breakStart, log.date);
          const breakE = this.attendanceService.parseOfficeTime(settings.breakEnd, log.date);
          if (checkInTime < breakE && officeEnd > breakS) {
            const overlapStart = new Date(Math.max(checkInTime.getTime(), breakS.getTime()));
            const overlapEnd = new Date(Math.min(officeEnd.getTime(), breakE.getTime()));
            logBreakHours = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60);
          }
        }

        const finalHours = Math.max(0, Math.round((totalHours - logBreakHours) * 100) / 100);

        await tx
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
      });
      await Promise.all(promises);
    });

    this.logger.log(`Auto-checkout completed: processed ${activeLogs.length} logs`);
    return { status: 'success', processed: activeLogs.length };
  }
}
