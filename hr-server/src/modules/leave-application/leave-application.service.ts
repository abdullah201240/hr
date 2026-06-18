import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { eq, and, between, desc, asc, count, sum, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { DB_CONNECTION, type Database } from '../../db';
import { leaveApplications, leaveTypes, employees, attendanceLogs, leaveAttachments } from '../../db/schema';

const approver = alias(employees, 'approver');
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys, resolveKey } from '../../common/cache/cache-keys';
import { LEAVE_APPLICATION_QUEUE } from '../queue/queue.module';
import type {
  CreateLeaveApplicationJobData,
  UpdateLeaveApplicationJobData,
} from './leave-application.processor';
import type {
  CreateLeaveApplicationDto,
  UpdateLeaveApplicationStatusDto,
  UpdateLeaveApplicationDto,
} from './dto/create-leave-application.dto';
import type { LeaveApplicationQueryDto } from './dto/leave-application-query.dto';

@Injectable()
export class LeaveApplicationService {
  private readonly logger = new Logger(LeaveApplicationService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
    @InjectQueue(LEAVE_APPLICATION_QUEUE)
    private readonly leaveQueue: Queue<CreateLeaveApplicationJobData | UpdateLeaveApplicationJobData>,
  ) {}

  // ─── Enqueue Create (async via BullMQ) ───────────────────────────────────
  async createAsync(
    employeeId: string,
    dto: CreateLeaveApplicationDto,
  ): Promise<{ jobId: string; status: string; message: string }> {
    const payload: CreateLeaveApplicationJobData = {
      type: 'create',
      employeeId,
      leaveTypeId: dto.leaveTypeId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      reason: dto.reason,
      attachments: (dto.attachments ?? []).map((a) => ({
        id: a.id,
        title: a.title,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
      })),
    };

    const job = await this.leaveQueue.add('create-leave-application', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1500 },
      removeOnComplete: { count: 200, age: 60 * 60 * 24 * 7 },  // keep 7 days
      removeOnFail: { count: 500, age: 60 * 60 * 24 * 30 },     // keep 30 days
    });

    this.logger.log(`Enqueued leave application creation job: ${job.id} for employee ${employeeId}`);
    return {
      jobId: job.id!,
      status: 'queued',
      message: 'Your leave application is being processed. Please wait for confirmation.',
    };
  }

  // ─── Enqueue Update/Resubmit (async via BullMQ) ──────────────────────────
  async updateAsync(
    id: string,
    employeeId: string,
    role: string,
    dto: UpdateLeaveApplicationDto,
  ): Promise<{ jobId: string; status: string; message: string }> {
    // Quick pre-check that the application exists before queuing
    const [app] = await this.db
      .select({ id: leaveApplications.id, status: leaveApplications.status })
      .from(leaveApplications)
      .where(eq(leaveApplications.id, id))
      .limit(1);

    if (!app) {
      throw new NotFoundException(`Leave application with ID "${id}" not found`);
    }
    if (app.status !== 'Pending' && app.status !== 'Rejected') {
      throw new BadRequestException(`Cannot edit a leave application with status "${app.status}"`);
    }

    const payload: UpdateLeaveApplicationJobData = {
      type: 'update',
      id,
      employeeId,
      role,
      leaveTypeId: dto.leaveTypeId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      reason: dto.reason,
      attachments: (dto.attachments ?? []).map((a) => ({
        id: (a as any).id,
        title: a.title,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
      })),
    };

    const job = await this.leaveQueue.add('update-leave-application', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1500 },
      removeOnComplete: { count: 200, age: 60 * 60 * 24 * 7 },
      removeOnFail: { count: 500, age: 60 * 60 * 24 * 30 },
    });

    this.logger.log(`Enqueued leave application update job: ${job.id} for application ${id}`);
    return {
      jobId: job.id!,
      status: 'queued',
      message: 'Your leave application update is being processed.',
    };
  }

  // ─── Get Job Status ───────────────────────────────────────────────────────
  async getJobStatus(jobId: string): Promise<{
    jobId: string;
    state: string;
    result?: any;
    error?: string;
    progress?: number;
  }> {
    const job = await this.leaveQueue.getJob(jobId);
    if (!job) {
      return { jobId, state: 'not_found' };
    }

    const state = await job.getState();
    const response: any = { jobId, state };

    if (state === 'completed') {
      response.result = job.returnvalue;
    } else if (state === 'failed') {
      response.error = job.failedReason ?? 'Unknown error';
    } else if (state === 'active') {
      response.progress = typeof job.progress === 'number' ? job.progress : 0;
    }

    return response;
  }

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
        })
        .returning();

      // 7. Insert attachments to leaveAttachments table
      const clientAttachments = Array.isArray(dto.attachments)
        ? (dto.attachments as any).flat().filter((x: any) => x && typeof x === 'object')
        : [];

      if (clientAttachments.length > 0) {
        await tx.insert(leaveAttachments).values(
          clientAttachments.map((att: any) => ({
            leaveApplicationId: created.id,
            title: att.title || 'Attachment',
            fileName: att.fileName || 'file',
            fileUrl: att.fileUrl,
          })),
        );
      }

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
        createdAt: leaveApplications.createdAt,
        employeeName: employees.fullNameEnglish,
        employeeEmail: employees.email,
        employeeIdCode: employees.employeeId,
        employeePhone: employees.phone,
        employeeEmergencyPhone: employees.emergencyContactNumber,
        employeeId: leaveApplications.employeeId,
        leaveTypeName: leaveTypes.name,
        leaveTypeId: leaveTypes.id,
        leaveTypePaid: leaveTypes.paid,
        rejectionReason: leaveApplications.rejectionReason,
        approvedByName: approver.fullNameEnglish,
        approvedAt: leaveApplications.approvedAt,
        rejectedAt: leaveApplications.rejectedAt,
      })
      .from(leaveApplications)
      .innerJoin(employees, eq(leaveApplications.employeeId, employees.id))
      .innerJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id))
      .leftJoin(approver, eq(leaveApplications.approvedById, approver.id))
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

    // Fetch and attach attachments for paginated records
    const ids = paginated.map((r) => r.id);
    const allAttachments = ids.length > 0
      ? await this.db
          .select({
            id: leaveAttachments.id,
            leaveApplicationId: leaveAttachments.leaveApplicationId,
            title: leaveAttachments.title,
            fileName: leaveAttachments.fileName,
            fileUrl: leaveAttachments.fileUrl,
          })
          .from(leaveAttachments)
          .where(inArray(leaveAttachments.leaveApplicationId, ids))
      : [];

    const attachmentsMap = new Map<string, any[]>();
    for (const att of allAttachments) {
      const list = attachmentsMap.get(att.leaveApplicationId) || [];
      list.push({
        id: att.id,
        title: att.title,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
      });
      attachmentsMap.set(att.leaveApplicationId, list);
    }

    const paginatedWithAttachments = paginated.map((item) => ({
      ...item,
      attachments: attachmentsMap.get(item.id) || [],
    }));

    const result = {
      data: paginatedWithAttachments,
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
        createdAt: leaveApplications.createdAt,
        employeeName: employees.fullNameEnglish,
        employeeEmail: employees.email,
        employeeIdCode: employees.employeeId,
        employeePhone: employees.phone,
        employeeEmergencyPhone: employees.emergencyContactNumber,
        leaveTypeName: leaveTypes.name,
        leaveTypeId: leaveTypes.id,
        leaveTypePaid: leaveTypes.paid,
        rejectionReason: leaveApplications.rejectionReason,
        approvedByName: approver.fullNameEnglish,
        approvedAt: leaveApplications.approvedAt,
        rejectedAt: leaveApplications.rejectedAt,
      })
      .from(leaveApplications)
      .innerJoin(employees, eq(leaveApplications.employeeId, employees.id))
      .innerJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id))
      .leftJoin(approver, eq(leaveApplications.approvedById, approver.id))
      .where(eq(leaveApplications.id, id))
      .limit(1);

    if (!application) {
      throw new NotFoundException(`Leave application with ID "${id}" not found`);
    }

    const attachments = await this.db
      .select({
        id: leaveAttachments.id,
        title: leaveAttachments.title,
        fileName: leaveAttachments.fileName,
        fileUrl: leaveAttachments.fileUrl,
      })
      .from(leaveAttachments)
      .where(eq(leaveAttachments.leaveApplicationId, id));

    const result = {
      ...application,
      attachments,
    };

    await this.cache.setByKey(CacheKeys.leaveApplicationById, result, id);
    return result;
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
        const dateStrings: string[] = [];
        for (let i = 0; i < totalDays; i++) {
          const currentDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
          dateStrings.push(this.getLocalDateStr(currentDate));
        }

        // Fetch existing logs in a single query
        const existingLogs = await tx
          .select()
          .from(attendanceLogs)
          .where(
            and(
              eq(attendanceLogs.employeeId, app.employeeId),
              inArray(attendanceLogs.date, dateStrings),
            ),
          );

        const existingLogsMap = new Map(existingLogs.map((log) => [log.date, log]));

        const toUpdateIds: string[] = [];
        const toInsert: any[] = [];

        for (const dateStr of dateStrings) {
          const existingLog = existingLogsMap.get(dateStr);
          if (existingLog) {
            toUpdateIds.push(existingLog.id);
          } else {
            toInsert.push({
              employeeId: app.employeeId,
              date: dateStr,
              status: 'leave',
              notes: leaveType ? `${leaveType.name}` : 'Leave Approved',
            });
          }
        }

        if (toUpdateIds.length > 0) {
          await tx
            .update(attendanceLogs)
            .set({
              status: 'leave',
              notes: leaveType ? `${leaveType.name}` : 'Leave Approved',
            })
            .where(inArray(attendanceLogs.id, toUpdateIds));
        }

        if (toInsert.length > 0) {
          await tx.insert(attendanceLogs).values(toInsert);
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

      // Fetch the canceller's name for audit trail
      const [canceller] = await tx
        .select({ fullNameEnglish: employees.fullNameEnglish, employeeId: employees.employeeId })
        .from(employees)
        .where(eq(employees.id, employeeId))
        .limit(1);

      const cancellerName = canceller?.fullNameEnglish || 'Unknown';
      const cancellerIdCode = canceller?.employeeId || employeeId;
      const cancelNote = role === 'employee'
        ? `Cancelled by employee: ${cancellerName} (ID: ${cancellerIdCode})`
        : `Cancelled by administrator: ${cancellerName} (ID: ${cancellerIdCode})`;

      const previousStatus = app.status;

      const [updated] = await tx
        .update(leaveApplications)
        .set({
          status: 'Rejected',
          rejectionReason: cancelNote,
          rejectedAt: new Date(),
        })
        .where(eq(leaveApplications.id, id))
        .returning();

      const start = this.parseDateUTC(app.startDate);
      const startYear = start.getUTCFullYear();

      // ─── If previous status was Approved: Remove attendance logs of status 'leave' ───
      if (previousStatus === 'Approved') {
        const totalDays = app.days;
        const dateStrings: string[] = [];
        for (let i = 0; i < totalDays; i++) {
          const currentDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
          dateStrings.push(this.getLocalDateStr(currentDate));
        }

        // Delete attendance logs with status 'leave' so they fall back to dynamic weekend/holiday/absent
        await tx
          .delete(attendanceLogs)
          .where(
            and(
              eq(attendanceLogs.employeeId, app.employeeId),
              eq(attendanceLogs.status, 'leave'),
              inArray(attendanceLogs.date, dateStrings),
            ),
          );
      }

      await this.invalidateCache(app.employeeId, startYear, id);
      this.logger.log(`Leave application ${id} cancelled by ${employeeId}`);
      return updated;
    });
  }

  // ─── Edit & Resubmit Leave Application ─────────────────────────────────────
  async update(id: string, employeeId: string, role: string, dto: UpdateLeaveApplicationDto) {
    return this.db.transaction(async (tx) => {
      // 1. Fetch leave application
      const [app] = await tx
        .select()
        .from(leaveApplications)
        .where(eq(leaveApplications.id, id))
        .limit(1);

      if (!app) {
        throw new NotFoundException(`Leave application with ID "${id}" not found`);
      }

      // Only the employee who created the application (or an admin/hr) can edit it
      if (role !== 'admin' && role !== 'hr' && app.employeeId !== employeeId) {
        throw new BadRequestException('You are not authorized to update this leave application');
      }

      // Can only edit if status is 'Pending' or 'Rejected'
      if (app.status !== 'Pending' && app.status !== 'Rejected') {
        throw new BadRequestException(`Cannot edit leave application in ${app.status} status`);
      }

      const start = this.parseDateUTC(dto.startDate || app.startDate);
      const end = this.parseDateUTC(dto.endDate || app.endDate);

      if (start > end) {
        throw new BadRequestException('Start date cannot be after end date');
      }

      const timeDiff = end.getTime() - start.getTime();
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;

      // Update leave application details
      const updateData: Record<string, any> = {
        startDate: dto.startDate || app.startDate,
        endDate: dto.endDate || app.endDate,
        days,
        reason: dto.reason !== undefined ? dto.reason : app.reason,
        status: 'Pending', // Resubmitted applications reset to Pending
      };

      if (dto.leaveTypeId) {
        updateData.leaveTypeId = dto.leaveTypeId;
      }

      const [updated] = await tx
        .update(leaveApplications)
        .set(updateData)
        .where(eq(leaveApplications.id, id))
        .returning();

      // If attachments are provided, replace them in the relational table
      if (dto.attachments) {
        // Delete old attachments
        await tx.delete(leaveAttachments).where(eq(leaveAttachments.leaveApplicationId, id));

        // Insert new ones
        const clientAttachments = Array.isArray(dto.attachments)
          ? (dto.attachments as any).flat().filter((x: any) => x && typeof x === 'object')
          : [];

        if (clientAttachments.length > 0) {
          await tx.insert(leaveAttachments).values(
            clientAttachments.map((att: any) => ({
              leaveApplicationId: id,
              title: att.title || 'Attachment',
              fileName: att.fileName || 'file',
              fileUrl: att.fileUrl,
            })),
          );
        }
      }

      await this.invalidateCache(app.employeeId, start.getUTCFullYear(), id);
      this.logger.log(`Leave application ${id} updated/resubmitted by ${employeeId}`);
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
    // Fetch employee gender to check eligibility
    const [employee] = await db
      .select({ gender: employees.gender })
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    const gender = employee?.gender?.toLowerCase() || '';

    // 1. Fetch all active leave types
    const activeTypes = await db
      .select()
      .from(leaveTypes)
      .where(eq(leaveTypes.isActive, true))
      .orderBy(asc(leaveTypes.name));

    // Filter activeTypes based on eligibility (e.g. gender matching)
    const eligibleTypes = activeTypes.filter((lt: any) => {
      if (!lt.eligibility) return true;
      const eligibilityLower = lt.eligibility.toLowerCase();
      if (eligibilityLower.includes('female') && gender !== 'female') {
        return false;
      }
      if (eligibilityLower.includes('male') && gender !== 'male') {
        return false;
      }
      return true;
    });

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
    return eligibleTypes.map((lt: any) => {
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
