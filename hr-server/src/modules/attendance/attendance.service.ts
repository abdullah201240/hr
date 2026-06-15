import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { eq, and, between, asc } from 'drizzle-orm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DB_CONNECTION, type Database } from '../../db';
import { attendanceLogs, attendanceSettings, holidays, employees } from '../../db/schema';
import { ATTENDANCE_QUEUE } from '../queue/queue.module';
import { CheckInDto, CheckOutDto, SubmitCorrectionDto, AdminLogOverrideDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService implements OnModuleInit {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    @InjectQueue(ATTENDANCE_QUEUE) private readonly attendanceQueue: Queue,
  ) {}

  async onModuleInit() {
    try {
      // Clean up any existing repeatable jobs to avoid duplicates with different options
      const jobs = await this.attendanceQueue.getRepeatableJobs();
      for (const job of jobs) {
        await this.attendanceQueue.removeRepeatableByKey(job.key);
      }

      // 1. Everyday at 12:05 AM, initialize logs for all active employees
      await this.attendanceQueue.add(
        'initialize-daily-attendance',
        {},
        {
          repeat: {
            pattern: '5 0 * * *', // 12:05 AM daily
          },
          removeOnComplete: true,
          removeOnFail: true,
        },
      );

      // 2. Every 5 minutes, self-heal and check out employees who forgot to punch out
      await this.attendanceQueue.add(
        'auto-checkout-attendance',
        {},
        {
          repeat: {
            pattern: '*/5 * * * *', // Every 5 minutes
          },
          removeOnComplete: true,
          removeOnFail: true,
        },
      );

      this.logger.log('BullMQ Attendance repeatable jobs successfully registered');
    } catch (err: any) {
      this.logger.error('Failed to register BullMQ repeatable jobs:', err.message);
    }
  }

  // Helper: Format Date to local YYYY-MM-DD
  getLocalTodayStr(date: Date = new Date()): string {
    return date.toLocaleDateString('en-CA'); // Outputs YYYY-MM-DD in local time
  }

  // Helper: Parse dynamic office time string (HH:MM) to Date on a specific date
  parseOfficeTime(timeStr: string, dateStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  }

  // Helper: Parse AM/PM time string (e.g. "09:05 AM") to Date on a specific date
  parseTimeString(timeStr: string, dateStr: string): Date {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  }

  // Helper: Format Date object to "hh:mm A" string
  formatTime(date: Date): string {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const modifier = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const minStr = minutes.toString().padStart(2, '0');
    const hrStr = hours.toString().padStart(2, '0');
    return `${hrStr}:${minStr} ${modifier}`;
  }

  // ─── Manual Check-In ───────────────────────────────────────────────────────
  async checkIn(employeeId: string, dto: CheckInDto) {
    const dateStr = this.getLocalTodayStr();
    const now = new Date();

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

    // 2. Check if log already exists
    let [log] = await this.db
      .select()
      .from(attendanceLogs)
      .where(and(eq(attendanceLogs.employeeId, employeeId), eq(attendanceLogs.date, dateStr)))
      .limit(1);

    if (log && log.checkIn) {
      throw new ConflictException('You have already checked in for today');
    }

    // 3. Format check-in time and status (late vs present)
    const checkInStr = this.formatTime(now);
    const officeStart = this.parseOfficeTime(settings.startTime, dateStr);
    const graceEnd = new Date(officeStart.getTime() + settings.lateThreshold * 60 * 1000);
    const isLate = now > graceEnd;
    const status = isLate ? 'late' : 'present';

    if (log) {
      // Update existing auto-generated record
      const [updated] = await this.db
        .update(attendanceLogs)
        .set({
          status,
          checkIn: checkInStr,
          location: dto.location,
          ipAddress: dto.ipAddress || null,
          device: dto.device || null,
          notes: dto.notes || null,
        })
        .where(eq(attendanceLogs.id, log.id))
        .returning();
      return updated;
    } else {
      // Create new record
      const [created] = await this.db
        .insert(attendanceLogs)
        .values({
          employeeId,
          date: dateStr,
          status,
          checkIn: checkInStr,
          location: dto.location,
          ipAddress: dto.ipAddress || null,
          device: dto.device || null,
          notes: dto.notes || null,
        })
        .returning();
      return created;
    }
  }

  // ─── Manual Check-Out ──────────────────────────────────────────────────────
  async checkOut(employeeId: string, dto: CheckOutDto) {
    const dateStr = this.getLocalTodayStr();
    const now = new Date();

    // 1. Get log
    const [log] = await this.db
      .select()
      .from(attendanceLogs)
      .where(and(eq(attendanceLogs.employeeId, employeeId), eq(attendanceLogs.date, dateStr)))
      .limit(1);

    if (!log || !log.checkIn) {
      throw new BadRequestException('You must check in before checking out');
    }

    if (log.checkOut) {
      throw new ConflictException('You have already checked out for today');
    }

    // 2. Get office settings
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

    // 3. Perform calculations
    const checkOutStr = this.formatTime(now);
    const checkInTime = this.parseTimeString(log.checkIn, dateStr);
    const checkOutTime = now;

    // Working hours diff
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const totalHours = diffMs / (1000 * 60 * 60);

    // Calculate break hours overlap
    let breakHours = 0;
    if (settings.breakStart && settings.breakEnd) {
      const breakS = this.parseOfficeTime(settings.breakStart, dateStr);
      const breakE = this.parseOfficeTime(settings.breakEnd, dateStr);
      if (checkInTime < breakE && checkOutTime > breakS) {
        const overlapStart = new Date(Math.max(checkInTime.getTime(), breakS.getTime()));
        const overlapEnd = new Date(Math.min(checkOutTime.getTime(), breakE.getTime()));
        breakHours = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60);
      }
    }

    const finalHours = Math.max(0, Math.round((totalHours - breakHours) * 100) / 100);

    const [updated] = await this.db
      .update(attendanceLogs)
      .set({
        checkOut: checkOutStr,
        hours: finalHours,
        breakHours: Math.round(breakHours * 100) / 100,
        notes: dto.notes || log.notes,
      })
      .where(eq(attendanceLogs.id, log.id))
      .returning();

    return updated;
  }

  // ─── Get Employee Logs (Monthly view) ──────────────────────────────────────
  async getLogs(employeeId: string, year: number, month: number) {
    // month is 0-indexed on client (0 = January, 5 = June, etc.)
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Last day of month

    const startStr = this.getLocalTodayStr(startDate);
    const endStr = this.getLocalTodayStr(endDate);
    const todayStr = this.getLocalTodayStr();

    // 1. Get logs, settings, and holidays
    const [logsList, [settings], holidaysList] = await Promise.all([
      this.db
        .select()
        .from(attendanceLogs)
        .where(and(eq(attendanceLogs.employeeId, employeeId), between(attendanceLogs.date, startStr, endStr)))
        .orderBy(asc(attendanceLogs.date)),
      this.db.select().from(attendanceSettings).limit(1),
      this.db.select().from(holidays).where(between(holidays.startDate, startStr, endStr)),
    ]);

    const weeklyHolidays = settings?.weeklyHolidays || ['Saturday', 'Sunday'];
    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Map logs to date keys for fast lookup
    const logsMap = new Map(logsList.map((l) => [l.date, l]));

    const result: any[] = [];
    const daysInMonth = endDate.getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const currentDateStr = this.getLocalTodayStr(currentDate);
      const dayName = DAY_NAMES[currentDate.getDay()];

      const existingRecord = logsMap.get(currentDateStr);

      if (existingRecord) {
        result.push({
          day,
          dateStr: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dayName,
          status: existingRecord.status,
          checkIn: existingRecord.checkIn,
          checkOut: existingRecord.checkOut,
          hours: existingRecord.hours,
          breakHours: existingRecord.breakHours,
          location: existingRecord.location,
          ipAddress: existingRecord.ipAddress,
          device: existingRecord.device,
          notes: existingRecord.notes,
          correctionStatus: existingRecord.correctionStatus,
          proposedCheckIn: existingRecord.proposedCheckIn,
          proposedCheckOut: existingRecord.proposedCheckOut,
          correctionReason: existingRecord.correctionReason,
        });
        continue;
      }

      // Check if it's in the future
      const isFuture = currentDateStr > todayStr;

      // Check holidays
      const regularHoliday = holidaysList.find((h) => {
        const start = new Date(h.startDate + 'T00:00:00');
        const end = new Date(h.endDate + 'T00:00:00');
        return currentDate >= start && currentDate <= end;
      });

      let status: string = 'absent';
      let notes: string | null = null;

      if (isFuture) {
        status = 'upcoming';
      } else if (regularHoliday) {
        status = 'holiday';
        notes = regularHoliday.name;
      } else if (weeklyHolidays.includes(dayName)) {
        status = 'weekend';
      }

      result.push({
        day,
        dateStr: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayName,
        status,
        checkIn: null,
        checkOut: null,
        hours: null,
        breakHours: 0,
        location: null,
        ipAddress: null,
        device: null,
        notes,
        correctionStatus: 'none',
      });
    }

    return result;
  }

  // ─── Submit Correction ─────────────────────────────────────────────────────
  async submitCorrection(employeeId: string, dto: SubmitCorrectionDto) {
    let [log] = await this.db
      .select()
      .from(attendanceLogs)
      .where(and(eq(attendanceLogs.employeeId, employeeId), eq(attendanceLogs.date, dto.date)))
      .limit(1);

    if (!log) {
      // If no log exists (e.g. employee didn't get initialized but is requesting a change), create an absent base log first
      const [newLog] = await this.db
        .insert(attendanceLogs)
        .values({
          employeeId,
          date: dto.date,
          status: 'absent',
        })
        .returning();
      log = newLog;
    }

    const [updated] = await this.db
      .update(attendanceLogs)
      .set({
        correctionStatus: 'pending',
        proposedCheckIn: dto.proposedCheckIn,
        proposedCheckOut: dto.proposedCheckOut,
        correctionReason: dto.correctionReason,
      })
      .where(eq(attendanceLogs.id, log.id))
      .returning();

    return updated;
  }

  // ─── Daily Logs for Admin/HR ───────────────────────────────────────────────
  async getDailyLogs(dateStr: string) {
    const list = await this.db
      .select({
        id: attendanceLogs.id,
        date: attendanceLogs.date,
        status: attendanceLogs.status,
        checkIn: attendanceLogs.checkIn,
        checkOut: attendanceLogs.checkOut,
        hours: attendanceLogs.hours,
        location: attendanceLogs.location,
        ipAddress: attendanceLogs.ipAddress,
        device: attendanceLogs.device,
        correctionStatus: attendanceLogs.correctionStatus,
        correctionReason: attendanceLogs.correctionReason,
        proposedCheckIn: attendanceLogs.proposedCheckIn,
        proposedCheckOut: attendanceLogs.proposedCheckOut,
        employeeName: employees.fullNameEnglish,
        employeeIdCode: employees.employeeId,
        employeeId: employees.id,
      })
      .from(attendanceLogs)
      .innerJoin(employees, eq(attendanceLogs.employeeId, employees.id))
      .where(eq(attendanceLogs.date, dateStr));

    return list;
  }

  // ─── Approve Correction ────────────────────────────────────────────────────
  async approveCorrection(logId: string) {
    const [log] = await this.db
      .select()
      .from(attendanceLogs)
      .where(eq(attendanceLogs.id, logId))
      .limit(1);

    if (!log) {
      throw new NotFoundException('Attendance log not found');
    }

    if (log.correctionStatus !== 'pending') {
      throw new BadRequestException('No pending correction request for this log');
    }

    // Get office settings for break calculation
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

    const checkInTime = this.parseTimeString(log.proposedCheckIn!, log.date);
    const checkOutTime = this.parseTimeString(log.proposedCheckOut!, log.date);

    // Re-calculate working hours
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const totalHours = diffMs / (1000 * 60 * 60);

    let breakHours = 0;
    if (settings.breakStart && settings.breakEnd) {
      const breakS = this.parseOfficeTime(settings.breakStart, log.date);
      const breakE = this.parseOfficeTime(settings.breakEnd, log.date);
      if (checkInTime < breakE && checkOutTime > breakS) {
        const overlapStart = new Date(Math.max(checkInTime.getTime(), breakS.getTime()));
        const overlapEnd = new Date(Math.min(checkOutTime.getTime(), breakE.getTime()));
        breakHours = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60);
      }
    }

    const finalHours = Math.max(0, Math.round((totalHours - breakHours) * 100) / 100);

    // Determine status (late vs present)
    const officeStart = this.parseOfficeTime(settings.startTime, log.date);
    const graceEnd = new Date(officeStart.getTime() + settings.lateThreshold * 60 * 1000);
    const isLate = checkInTime > graceEnd;
    const status = isLate ? 'late' : 'present';

    const [updated] = await this.db
      .update(attendanceLogs)
      .set({
        checkIn: log.proposedCheckIn,
        checkOut: log.proposedCheckOut,
        hours: finalHours,
        breakHours: Math.round(breakHours * 100) / 100,
        status,
        correctionStatus: 'approved',
        notes: `Correction approved: ${log.correctionReason}`,
      })
      .where(eq(attendanceLogs.id, logId))
      .returning();

    return updated;
  }

  // ─── Reject Correction ─────────────────────────────────────────────────────
  async rejectCorrection(logId: string) {
    const [log] = await this.db
      .select()
      .from(attendanceLogs)
      .where(eq(attendanceLogs.id, logId))
      .limit(1);

    if (!log) {
      throw new NotFoundException('Attendance log not found');
    }

    if (log.correctionStatus !== 'pending') {
      throw new BadRequestException('No pending correction request for this log');
    }

    const [updated] = await this.db
      .update(attendanceLogs)
      .set({
        correctionStatus: 'rejected',
      })
      .where(eq(attendanceLogs.id, logId))
      .returning();

    return updated;
  }

  // ─── Pending Corrections for Admin/HR ──────────────────────────────────────
  async getPendingCorrections() {
    return this.db
      .select({
        id: attendanceLogs.id,
        date: attendanceLogs.date,
        status: attendanceLogs.status,
        checkIn: attendanceLogs.checkIn,
        checkOut: attendanceLogs.checkOut,
        proposedCheckIn: attendanceLogs.proposedCheckIn,
        proposedCheckOut: attendanceLogs.proposedCheckOut,
        correctionReason: attendanceLogs.correctionReason,
        correctionStatus: attendanceLogs.correctionStatus,
        employeeName: employees.fullNameEnglish,
        employeeIdCode: employees.employeeId,
      })
      .from(attendanceLogs)
      .innerJoin(employees, eq(attendanceLogs.employeeId, employees.id))
      .where(eq(attendanceLogs.correctionStatus, 'pending'))
      .orderBy(asc(attendanceLogs.date));
  }

  // ─── Manual Override/Log Creation by Admin/HR ──────────────────────────────
  async overrideAttendance(dto: AdminLogOverrideDto) {
    const { employeeId, date, status, checkIn, checkOut, notes } = dto;

    // Check if employee exists
    const [emp] = await this.db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (!emp) {
      throw new NotFoundException(`Employee with ID "${employeeId}" not found`);
    }

    let [log] = await this.db
      .select()
      .from(attendanceLogs)
      .where(and(eq(attendanceLogs.employeeId, employeeId), eq(attendanceLogs.date, date)))
      .limit(1);

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

    let hours: number | null = null;
    let breakHours = 0;

    if (checkIn && checkOut) {
      const checkInTime = this.parseTimeString(checkIn, date);
      const checkOutTime = this.parseTimeString(checkOut, date);
      const diffMs = checkOutTime.getTime() - checkInTime.getTime();
      const totalHours = diffMs / (1000 * 60 * 60);

      if (settings.breakStart && settings.breakEnd) {
        const breakS = this.parseOfficeTime(settings.breakStart, date);
        const breakE = this.parseOfficeTime(settings.breakEnd, date);
        if (checkInTime < breakE && checkOutTime > breakS) {
          const overlapStart = new Date(Math.max(checkInTime.getTime(), breakS.getTime()));
          const overlapEnd = new Date(Math.min(checkOutTime.getTime(), breakE.getTime()));
          breakHours = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60);
        }
      }
      hours = Math.max(0, Math.round((totalHours - breakHours) * 100) / 100);
    }

    if (log) {
      const [updated] = await this.db
        .update(attendanceLogs)
        .set({
          status,
          checkIn: checkIn || null,
          checkOut: checkOut || null,
          hours,
          breakHours: Math.round(breakHours * 100) / 100,
          notes: notes || 'Manual override by Admin',
        })
        .where(eq(attendanceLogs.id, log.id))
        .returning();
      return updated;
    } else {
      const [created] = await this.db
        .insert(attendanceLogs)
        .values({
          employeeId,
          date,
          status,
          checkIn: checkIn || null,
          checkOut: checkOut || null,
          hours,
          breakHours: Math.round(breakHours * 100) / 100,
          notes: notes || 'Manual entry by Admin',
        })
        .returning();
      return created;
    }
  }
}

