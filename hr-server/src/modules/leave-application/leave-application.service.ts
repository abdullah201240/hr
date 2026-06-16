import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { eq, and, between, desc, asc, count, sum } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import { leaveApplications, leaveTypes, employees, attendanceLogs } from '../../db/schema';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys, resolveKey } from '../../common/cache/cache-keys';
import type {
  CreateLeaveApplicationDto,
  UpdateLeaveApplicationStatusDto,
} from './dto/create-leave-application.dto';
import type { LeaveApplicationQueryDto } from './dto/leave-application-query.dto';

@Injectable()
export class LeaveApplicationService {
  private readonly logger = new Logger(LeaveApplicationService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
  ) {}

  // Helper: Get local Date string (YYYY-MM-DD)
  private getLocalDateStr(date: Date): string {
    return date.toLocaleDateString('en-CA');
  }

  // Helper: Parse date string to Date safely in UTC to avoid offset issues
  private parseDateUTC(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  // ─── Create Leave Application ─────────────────────────────────────────────
  async create(employeeId: string, dto: CreateLeaveApplicationDto) {
    const start = this.parseDateUTC(dto.startDate);
    const end = this.parseDateUTC(dto.endDate);

    if (start > end) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    // Compute duration in days (inclusive)
    const timeDiff = end.getTime() - start.getTime();
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;

    return this.db.transaction(async (tx) => {
      // 1. Verify employee exists and is active
      const [employee] = await tx
        .select()
        .from(employees)
        .where(eq(employees.id, employeeId))
        .limit(1);

      if (!employee) {
        throw new NotFoundException(`Employee with ID "${employeeId}" not found`);
      }
      if (employee.status !== 'active') {
        throw new BadRequestException('Inactive employees cannot apply for leave');
      }

      // 2. Verify leave type exists and is active
      const [leaveType] = await tx
        .select()
        .from(leaveTypes)
        .where(eq(leaveTypes.id, dto.leaveTypeId))
        .limit(1);

      if (!leaveType) {
        throw new NotFoundException(`Leave type with ID "${dto.leaveTypeId}" not found`);
      }
      if (!leaveType.isActive) {
        throw new BadRequestException('This leave type is currently inactive');
      }

      // 3. Verify eligibility (e.g., "Female Employees Only" -> checks gender)
      if (leaveType.eligibility) {
        const eligibilityLower = leaveType.eligibility.toLowerCase();
        if (eligibilityLower.includes('female') && employee.gender.toLowerCase() !== 'female') {
          throw new BadRequestException('This leave type is only available to female employees');
        }
        if (eligibilityLower.includes('male') && employee.gender.toLowerCase() !== 'male') {
          throw new BadRequestException('This leave type is only available to male employees');
        }
      }

      // 4. Verify leave balance for the year of the start date
      const startYear = start.getUTCFullYear();
      const balances = await this.getLeaveBalancesInternal(tx, employeeId, startYear);
      const balance = balances.find((b: any) => b.id === leaveType.id);

      if (balance && (balance.total - balance.used) < days) {
        throw new BadRequestException(
          `Insufficient balance. You requested ${days} days, but only have ${balance.total - balance.used} days remaining.`,
        );
      }

      // 5. Check for overlapping approved leave applications
      const overlapping = await tx
        .select({ id: leaveApplications.id })
        .from(leaveApplications)
        .where(
          and(
            eq(leaveApplications.employeeId, employeeId),
            eq(leaveApplications.status, 'Approved'),
            between(leaveApplications.startDate, dto.startDate, dto.endDate),
          ),
        )
        .limit(1);

      if (overlapping.length > 0) {
        throw new ConflictException('You already have an approved leave application during this period');
      }

      // 6. Insert leave application
      const [created] = await tx
        .insert(leaveApplications)
        .values({
          employeeId,
          leaveTypeId: dto.leaveTypeId,
          startDate: dto.startDate,
          endDate: dto.endDate,
          days,
          reason: dto.reason,
          status: 'Pending',
          attachments: dto.attachments || [],
        })
        .returning();

      await this.invalidateCache(employeeId, startYear);

      this.logger.log(`Leave application created for employee ${employeeId}: ${days} days of ${leaveType.name}`);
      return created;
    });
  }

  // ─── Find All (with filters & search) ──────────────────────────────────────
  async findAll(query: LeaveApplicationQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      employeeId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const conditions = [];

    if (status) {
      conditions.push(eq(leaveApplications.status, status));
    }
    if (employeeId) {
      conditions.push(eq(leaveApplications.employeeId, employeeId));
    }

    // Handle search by employee name or reason
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Cache key parts for deterministic retrieval
    const cacheKeyParts = `${page}:${limit}:${search ?? ''}:${status ?? ''}:${employeeId ?? ''}:${sortBy}:${sortOrder}`;
    const cached = await this.cache.getByKey<any>(
      CacheKeys.leaveApplicationsList,
      cacheKeyParts,
    );
    if (cached) return cached;

    // Build database query
    const offset = (page - 1) * limit;

    const dbWhereConditions = [];
    if (status) dbWhereConditions.push(eq(leaveApplications.status, status));
    if (employeeId) dbWhereConditions.push(eq(leaveApplications.employeeId, employeeId));

    const finalWhere = dbWhereConditions.length > 0 ? and(...dbWhereConditions) : undefined;

    const rawList = await this.db
      .select({
        id: leaveApplications.id,
        startDate: leaveApplications.startDate,
        endDate: leaveApplications.endDate,
        days: leaveApplications.days,
        reason: leaveApplications.reason,
        status: leaveApplications.status,
        attachments: leaveApplications.attachments,
        createdAt: leaveApplications.createdAt,
        employeeName: employees.fullNameEnglish,
        employeeEmail: employees.email,
        employeeIdCode: employees.employeeId,
        leaveTypeName: leaveTypes.name,
        leaveTypeId: leaveTypes.id,
        rejectionReason: leaveApplications.rejectionReason,
      })
      .from(leaveApplications)
      .innerJoin(employees, eq(leaveApplications.employeeId, employees.id))
      .innerJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id))
      .where(finalWhere)
      .orderBy(sortOrder === 'asc' ? asc(leaveApplications.createdAt) : desc(leaveApplications.createdAt));

    // Apply search filter if query.search exists
    let processed = rawList;
    if (search) {
      const q = search.toLowerCase();
      processed = rawList.filter(
        (r) =>
          r.employeeName.toLowerCase().includes(q) ||
          r.leaveTypeName.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q),
      );
    }

    const total = processed.length;
    const paginated = processed.slice(offset, offset + limit);

    const result = {
      data: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cache.setByKey(CacheKeys.leaveApplicationsList, result, cacheKeyParts);
    return result;
  }

  // ─── Find One ─────────────────────────────────────────────────────────────
  async findOne(id: string) {
    const cached = await this.cache.getByKey<any>(CacheKeys.leaveApplicationById, id);
    if (cached) return cached;

    const [application] = await this.db
      .select({
        id: leaveApplications.id,
        employeeId: leaveApplications.employeeId,
        startDate: leaveApplications.startDate,
        endDate: leaveApplications.endDate,
        days: leaveApplications.days,
        reason: leaveApplications.reason,
        status: leaveApplications.status,
        attachments: leaveApplications.attachments,
        createdAt: leaveApplications.createdAt,
        employeeName: employees.fullNameEnglish,
        employeeEmail: employees.email,
        leaveTypeName: leaveTypes.name,
        leaveTypeId: leaveTypes.id,
        rejectionReason: leaveApplications.rejectionReason,
      })
      .from(leaveApplications)
      .innerJoin(employees, eq(leaveApplications.employeeId, employees.id))
      .innerJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id))
      .where(eq(leaveApplications.id, id))
      .limit(1);

    if (!application) {
      throw new NotFoundException(`Leave application with ID "${id}" not found`);
    }

    await this.cache.setByKey(CacheKeys.leaveApplicationById, application, id);
    return application;
  }

  // ─── Update Status (Approve/Reject) ───────────────────────────────────────
  async updateStatus(id: string, approvedById: string, dto: UpdateLeaveApplicationStatusDto) {
    return this.db.transaction(async (tx) => {
      const [app] = await tx
        .select()
        .from(leaveApplications)
        .where(eq(leaveApplications.id, id))
        .limit(1);

      if (!app) {
        throw new NotFoundException(`Leave application with ID "${id}" not found`);
      }

      if (app.status !== 'Pending') {
        throw new BadRequestException(`This application is already processed (Status: ${app.status})`);
      }

      const [leaveType] = await tx
        .select()
        .from(leaveTypes)
        .where(eq(leaveTypes.id, app.leaveTypeId))
        .limit(1);

      const updateData: Record<string, any> = {
        status: dto.status,
        approvedById: dto.status === 'Approved' ? approvedById : null,
        approvedAt: dto.status === 'Approved' ? new Date() : null,
        rejectedAt: dto.status === 'Rejected' ? new Date() : null,
        rejectionReason: dto.status === 'Rejected' ? dto.rejectionReason || 'No reason provided' : null,
      };

      const [updated] = await tx
        .update(leaveApplications)
        .set(updateData)
        .where(eq(leaveApplications.id, id))
        .returning();

      const start = this.parseDateUTC(app.startDate);
      const startYear = start.getUTCFullYear();

      // ─── If Approved: Sync attendance logs ───
      if (dto.status === 'Approved') {
        const totalDays = app.days;
        for (let i = 0; i < totalDays; i++) {
          const currentDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
          const dateStr = this.getLocalDateStr(currentDate);

          // Check if log exists
          const [existingLog] = await tx
            .select()
            .from(attendanceLogs)
            .where(
              and(
                eq(attendanceLogs.employeeId, app.employeeId),
                eq(attendanceLogs.date, dateStr),
              ),
            )
            .limit(1);

          if (existingLog) {
            await tx
              .update(attendanceLogs)
              .set({
                status: 'leave',
                notes: leaveType ? `${leaveType.name}` : 'Leave Approved',
              })
              .where(eq(attendanceLogs.id, existingLog.id));
          } else {
            await tx.insert(attendanceLogs).values({
              employeeId: app.employeeId,
              date: dateStr,
              status: 'leave',
              notes: leaveType ? `${leaveType.name}` : 'Leave Approved',
            });
          }
        }
      }

      await this.invalidateCache(app.employeeId, startYear, id);
      this.logger.log(`Leave application ${id} status updated to ${dto.status} by ${approvedById}`);
      return updated;
    });
  }

  // ─── Cancel Leave Application ─────────────────────────────────────────────
  async cancel(id: string, employeeId: string, role: string) {
    return this.db.transaction(async (tx) => {
      const [app] = await tx
        .select()
        .from(leaveApplications)
        .where(eq(leaveApplications.id, id))
        .limit(1);

      if (!app) {
        throw new NotFoundException(`Leave application with ID "${id}" not found`);
      }

      // Employees can only cancel their own leaves
      if (role !== 'admin' && role !== 'hr' && app.employeeId !== employeeId) {
        throw new BadRequestException('You are not authorized to cancel this leave application');
      }

      const previousStatus = app.status;

      // Update status to Rejected or just delete?
      // Typically, setting status to 'Rejected' (or a new 'Cancelled' status if preferred, but we will just mark 'Rejected' with rejectionReason: 'Cancelled by User') is standard.
      // Let's set status = 'Rejected' and rejectionReason = 'Cancelled by employee' or 'Cancelled by administrator'
      const [updated] = await tx
        .update(leaveApplications)
        .set({
          status: 'Rejected',
          rejectionReason: role === 'employee' ? 'Cancelled by employee' : 'Cancelled by administrator',
          rejectedAt: new Date(),
        })
        .where(eq(leaveApplications.id, id))
        .returning();

      const start = this.parseDateUTC(app.startDate);
      const startYear = start.getUTCFullYear();

      // ─── If previous status was Approved: Remove attendance logs of status 'leave' ───
      if (previousStatus === 'Approved') {
        const totalDays = app.days;
        for (let i = 0; i < totalDays; i++) {
          const currentDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
          const dateStr = this.getLocalDateStr(currentDate);

          // Delete attendance logs with status 'leave' so they fall back to dynamic weekend/holiday/absent
          await tx
            .delete(attendanceLogs)
            .where(
              and(
                eq(attendanceLogs.employeeId, app.employeeId),
                eq(attendanceLogs.date, dateStr),
                eq(attendanceLogs.status, 'leave'),
              ),
            );
        }
      }

      await this.invalidateCache(app.employeeId, startYear, id);
      this.logger.log(`Leave application ${id} cancelled by ${employeeId}`);
      return updated;
    });
  }

  // ─── Get Leave Balances ───────────────────────────────────────────────────
  async getLeaveBalances(employeeId: string, year: number) {
    const cached = await this.cache.getByKey<any>(CacheKeys.leaveBalances, employeeId, String(year));
    if (cached) return cached;

    const balances = await this.getLeaveBalancesInternal(this.db, employeeId, year);

    await this.cache.setByKey(CacheKeys.leaveBalances, balances, employeeId, String(year));
    return balances;
  }

  // Internal balance calculation query
  private async getLeaveBalancesInternal(db: any, employeeId: string, year: number) {
    // 1. Fetch all active leave types
    const activeTypes = await db
      .select()
      .from(leaveTypes)
      .where(eq(leaveTypes.isActive, true))
      .orderBy(asc(leaveTypes.name));

    // 2. Fetch approved leaves for this employee and year
    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;

    const approvedLeaves = await db
      .select({
        leaveTypeId: leaveApplications.leaveTypeId,
        days: leaveApplications.days,
      })
      .from(leaveApplications)
      .where(
        and(
          eq(leaveApplications.employeeId, employeeId),
          eq(leaveApplications.status, 'Approved'),
          between(leaveApplications.startDate, startOfYear, endOfYear),
        ),
      );

    // Sum up used days per leave type
    const usedMap = new Map<string, number>();
    for (const app of approvedLeaves) {
      const current = usedMap.get(app.leaveTypeId) || 0;
      usedMap.set(app.leaveTypeId, current + app.days);
    }

    // 3. Construct balance records
    return activeTypes.map((lt: any) => {
      const used = usedMap.get(lt.id) || 0;
      return {
        id: lt.id,
        key: lt.name.toLowerCase().replace(' leave', '').replace(' ', ''),
        label: lt.name,
        color: lt.color,
        icon: lt.icon,
        total: lt.days,
        used,
        requiresDocument: lt.requiresDocument,
      };
    });
  }

  // ─── Cache Invalidation ──────────────────────────────────────────────────
  private async invalidateCache(employeeId: string, year: number, id?: string) {
    const promises: Promise<void>[] = [
      this.cache.delByPattern(CacheKeys.leaveApplicationsList),
      this.cache.delByKey(CacheKeys.leaveBalances, employeeId, String(year)),
      // Invalidate attendance logs for employee as well
      this.cache.delPattern(resolveKey(CacheKeys.attendanceLogsByMonth, employeeId, '*', '*')),
      this.cache.delPattern(resolveKey(CacheKeys.attendanceDailyLogs, '*')),
    ];

    if (id) {
      promises.push(this.cache.delByKey(CacheKeys.leaveApplicationById, id));
    }

    await Promise.all(promises);
  }
}
