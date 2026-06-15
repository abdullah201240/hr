import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as bcrypt from 'bcrypt';
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import {
  employees,
  departments,
  designations,
  employeeSpouses,
  employeeChildren,
  employeeNominees,
  employeeBankDetails,
  employeeDocuments,
} from '../../db/schema';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys, resolveKey } from '../../common/cache/cache-keys';
import {
  EMPLOYEE_CREATE_QUEUE,
  EMPLOYEE_UPDATE_QUEUE,
  EMPLOYEE_STATUS_QUEUE,
} from '../queue/queue.module';
import type { CreateEmployeeDto } from './dto/create-employee.dto';
import type { UpdateEmployeeDto } from './dto/update-employee.dto';
import type { EmployeeQueryDto } from './dto/employee-query.dto';
import type { ChangeStatusDto } from './dto/change-status.dto';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
    @InjectQueue(EMPLOYEE_CREATE_QUEUE)
    private readonly createQueue: Queue<CreateEmployeeDto>,
    @InjectQueue(EMPLOYEE_UPDATE_QUEUE)
    private readonly updateQueue: Queue<UpdateEmployeeDto & { id: string }>,
    @InjectQueue(EMPLOYEE_STATUS_QUEUE)
    private readonly statusQueue: Queue<{ id: string; status: string }>,
  ) {}

  // ─── Enqueue create ─────────────────────────────────────────────────────

  async createAsync(
    dto: CreateEmployeeDto,
  ): Promise<{ jobId: string; status: string }> {
    // Pre-check uniqueness before queuing
    const existing = await this.db
      .select({ id: employees.id })
      .from(employees)
      .where(
        or(
          eq(employees.employeeId, dto.employeeId),
          eq(employees.email, dto.email),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(
        `Employee with ID "${dto.employeeId}" or email "${dto.email}" already exists`,
      );
    }

    const job = await this.createQueue.add('create-employee', dto, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    });

    this.logger.log(`Enqueued employee creation job: ${job.id}`);
    return { jobId: job.id!, status: 'queued' };
  }

  // ─── Enqueue update ─────────────────────────────────────────────────────

  async updateAsync(
    id: string,
    dto: UpdateEmployeeDto,
  ): Promise<{ jobId: string; status: string }> {
    const existing = await this.db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }

    const job = await this.updateQueue.add(
      'update-employee',
      { ...dto, id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    );

    this.logger.log(`Enqueued employee update job: ${job.id}`);
    return { jobId: job.id!, status: 'queued' };
  }

  // ─── Find one with all relations ────────────────────────────────────────

  async findOne(id: string) {
    const cached = await this.cache.getByKey<any>(CacheKeys.employeeById, id);
    if (cached) return cached;

    const [employee] = await this.db
      .select({
        id: employees.id,
        employeeId: employees.employeeId,
        email: employees.email,
        personalEmail: employees.personalEmail,
        fullNameEnglish: employees.fullNameEnglish,
        fullNameBangla: employees.fullNameBangla,
        phone: employees.phone,
        personalMobileNumber: employees.personalMobileNumber,
        religion: employees.religion,
        gender: employees.gender,
        dateOfBirth: employees.dateOfBirth,
        bloodGroup: employees.bloodGroup,
        maritalStatus: employees.maritalStatus,
        employeePhotoUrl: employees.employeePhotoUrl,
        nidNumber: employees.nidNumber,
        nidPdfUrl: employees.nidPdfUrl,
        tinNumber: employees.tinNumber,
        fatherNameEnglish: employees.fatherNameEnglish,
        fatherNameBangla: employees.fatherNameBangla,
        motherNameEnglish: employees.motherNameEnglish,
        motherNameBangla: employees.motherNameBangla,
        currentAddress: employees.currentAddress,
        permanentAddress: employees.permanentAddress,
        emergencyContactName: employees.emergencyContactName,
        emergencyContactRelation: employees.emergencyContactRelation,
        emergencyContactNumber: employees.emergencyContactNumber,
        designationId: employees.designationId,
        departmentId: employees.departmentId,
        employeeType: employees.employeeType,
        joinDate: employees.joinDate,
        lineManagerId: employees.lineManagerId,
        status: employees.status,
        inactiveDate: employees.inactiveDate,
        role: employees.role,
        isEmailVerified: employees.isEmailVerified,
        lastLoginAt: employees.lastLoginAt,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
        deletedAt: employees.deletedAt,
        departmentName: departments.name,
        designationName: designations.name,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .where(and(eq(employees.id, id), eq(employees.status, 'active')))
      .limit(1);

    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }

    const [spouses, children, nominees, documents] = await Promise.all([
      this.db
        .select()
        .from(employeeSpouses)
        .where(eq(employeeSpouses.employeeId, id)),
      this.db
        .select()
        .from(employeeChildren)
        .where(eq(employeeChildren.employeeId, id)),
      this.db
        .select()
        .from(employeeNominees)
        .where(eq(employeeNominees.employeeId, id)),
      this.db
        .select()
        .from(employeeDocuments)
        .where(eq(employeeDocuments.employeeId, id)),
    ]);

    const [bankDetail] = await this.db
      .select()
      .from(employeeBankDetails)
      .where(eq(employeeBankDetails.employeeId, id))
      .limit(1);

    const result = {
      ...employee,
      spouses,
      children,
      nominees,
      bankDetails: bankDetail ?? null,
      documents,
    };

    await this.cache.setByKey(CacheKeys.employeeById, result, id);

    return result;
  }

  // ─── Find all with filters & pagination ─────────────────────────────────

  async findAll(query: EmployeeQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      departmentId,
      designationId,
      status = 'active',
      employeeType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build a deterministic cache key from query params
    const cacheKeyParts = `${page}:${limit}:${search ?? ''}:${departmentId ?? ''}:${designationId ?? ''}:${status}:${employeeType ?? ''}:${sortBy}:${sortOrder}`;
    const cached = await this.cache.getByKey<any>(
      CacheKeys.employeeList,
      cacheKeyParts,
    );
    if (cached) return cached;

    const conditions = [];

    if (status) conditions.push(eq(employees.status, status));
    if (departmentId) conditions.push(eq(employees.departmentId, departmentId));
    if (designationId)
      conditions.push(eq(employees.designationId, designationId));
    if (employeeType) conditions.push(eq(employees.employeeType, employeeType));

    if (search) {
      conditions.push(
        or(
          like(employees.fullNameEnglish, `%${search}%`),
          like(employees.email, `%${search}%`),
          like(employees.employeeId, `%${search}%`),
        )!,
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Sort column
    const sortColumns: Record<string, any> = {
      joinDate: employees.joinDate,
      fullNameEnglish: employees.fullNameEnglish,
      employeeId: employees.employeeId,
      createdAt: employees.createdAt,
    };
    const sortCol = sortColumns[sortBy] ?? employees.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    // Paginated query with department/designation names via join
    const offset = (page - 1) * limit;

    // Run count + data in parallel for faster response
    const [[totalRow], data] = await Promise.all([
      this.db.select({ count: count() }).from(employees).where(where),
      this.db
        .select({
          id: employees.id,
          employeeId: employees.employeeId,
          fullNameEnglish: employees.fullNameEnglish,
          fullNameBangla: employees.fullNameBangla,
          email: employees.email,
          phone: employees.phone,
          gender: employees.gender,
          departmentId: employees.departmentId,
          departmentName: departments.name,
          designationId: employees.designationId,
          designationName: designations.name,
          employeeType: employees.employeeType,
          joinDate: employees.joinDate,
          status: employees.status,
          inactiveDate: employees.inactiveDate,
          employeePhotoUrl: employees.employeePhotoUrl,
          createdAt: employees.createdAt,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(designations, eq(employees.designationId, designations.id))
        .where(where)
        .orderBy(orderFn(sortCol))
        .limit(limit)
        .offset(offset),
    ]);

    const total = totalRow?.count ?? 0;

    const result = {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cache.setByKey(CacheKeys.employeeList, result, cacheKeyParts);

    return result;
  }

  // ─── Change status (active/inactive with optional scheduled date) ────────

  async changeStatus(id: string, dto: ChangeStatusDto) {
    const [existing] = await this.db
      .select({ id: employees.id, status: employees.status })
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }

    // ── Reactivate: set status to active immediately, clear inactiveDate, cancel pending jobs
    if (dto.status === 'active') {
      await this.db
        .update(employees)
        .set({ status: 'active', inactiveDate: null })
        .where(eq(employees.id, id));

      // Remove any pending delayed status-change jobs for this employee
      const waitingJobs = await this.statusQueue.getJobs(['waiting', 'delayed']);
      for (const job of waitingJobs) {
        if (job.data.id === id) {
          await job.remove();
          this.logger.log(`Cancelled pending status-change job ${job.id} for employee ${id}`);
        }
      }

      await this.cache.delByKey(CacheKeys.employeeById, id);
      await this.cache.delByPattern(CacheKeys.employeeList);

      return { message: 'Employee reactivated successfully', scheduled: false };
    }

    // ── Set inactive
    if (dto.inactiveDate) {
      const scheduledDate = new Date(dto.inactiveDate + 'T00:00:00');
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // If the date is today or in the past → apply immediately
      if (scheduledDate <= now) {
        await this.db
          .update(employees)
          .set({ status: 'inactive', inactiveDate: dto.inactiveDate })
          .where(eq(employees.id, id));

        await this.cache.delByKey(CacheKeys.employeeById, id);
        await this.cache.delByPattern(CacheKeys.employeeList);

        return { message: 'Employee marked inactive immediately', scheduled: false };
      }

      // Future date → store the scheduled date and enqueue a delayed job
      await this.db
        .update(employees)
        .set({ inactiveDate: dto.inactiveDate })
        .where(eq(employees.id, id));

      const delayMs = scheduledDate.getTime() - now.getTime();

      await this.statusQueue.add(
        'deactivate-employee',
        { id, status: 'inactive' },
        {
          delay: delayMs,
          attempts: 3,
          backoff: { type: 'exponential', delay: 60_000 },
          removeOnComplete: { count: 200 },
          removeOnFail: { count: 500 },
          jobId: `deactivate-${id}-${dto.inactiveDate}`,
        },
      );

      this.logger.log(
        `Scheduled employee ${id} to become inactive on ${dto.inactiveDate} (delay: ${Math.round(delayMs / 3600000)}h)`,
      );

      await this.cache.delByKey(CacheKeys.employeeById, id);
      await this.cache.delByPattern(CacheKeys.employeeList);

      return {
        message: `Employee scheduled to become inactive on ${dto.inactiveDate}`,
        scheduled: true,
        inactiveDate: dto.inactiveDate,
      };
    }

    // No date provided → mark inactive immediately
    await this.db
      .update(employees)
      .set({ status: 'inactive', inactiveDate: new Date().toISOString().split('T')[0] })
      .where(eq(employees.id, id));

    await this.cache.delByKey(CacheKeys.employeeById, id);
    await this.cache.delByPattern(CacheKeys.employeeList);

    return { message: 'Employee marked inactive immediately', scheduled: false };
  }

  // ─── Soft delete ────────────────────────────────────────────────────────

  async remove(id: string) {
    const [existing] = await this.db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }

    await this.db
      .update(employees)
      .set({
        status: 'terminated',
        deletedAt: new Date().toISOString().split('T')[0],
      })
      .where(eq(employees.id, id));

    // Invalidate cache
    await this.cache.delByKey(CacheKeys.employeeById, id);
    await this.cache.delByPattern(CacheKeys.employeeList);

    return { message: 'Employee terminated successfully' };
  }

  // ─── Job status ─────────────────────────────────────────────────────────

  async getJobStatus(
    queueName: string,
    jobId: string,
  ): Promise<{
    jobId: string;
    status: string;
    progress?: number;
    result?: any;
  }> {
    const queue = queueName === 'create' ? this.createQueue : this.updateQueue;
    const job = await queue.getJob(jobId);

    if (!job) {
      return { jobId, status: 'not-found' };
    }

    const state = await job.getState();
    return {
      jobId,
      status: state,
      progress: job.progress as number,
      result: job.returnvalue ?? undefined,
    };
  }

  // ─── Reset Password (Admin/HR only) ─────────────────────────────────────

  async resetPassword(id: string, newPassword: string): Promise<{ message: string }> {
    const [employee] = await this.db
      .select({ id: employees.id, refreshTokenVersion: employees.refreshTokenVersion })
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.db
      .update(employees)
      .set({
        passwordHash,
        refreshTokenVersion: employee.refreshTokenVersion + 1,
      })
      .where(eq(employees.id, id));

    // Clear caches
    await this.cache.delByKey(CacheKeys.employeeById, id);
    await this.cache.delByPattern(CacheKeys.employeeList);

    this.logger.log(`Password reset by administrator/HR for employee ID: ${id}`);
    return { message: 'Employee password reset successfully. All active sessions have been invalidated.' };
  }
}
