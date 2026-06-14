import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
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
} from '../queue/queue.module';
import type { CreateEmployeeDto } from './dto/create-employee.dto';
import type { UpdateEmployeeDto } from './dto/update-employee.dto';
import type { EmployeeQueryDto } from './dto/employee-query.dto';

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
  ) {}

  // ─── Enqueue create ─────────────────────────────────────────────────────

  async createAsync(dto: CreateEmployeeDto): Promise<{ jobId: string; status: string }> {
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

    const job = await this.updateQueue.add('update-employee', { ...dto, id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    });

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
      this.db.select().from(employeeSpouses).where(eq(employeeSpouses.employeeId, id)),
      this.db.select().from(employeeChildren).where(eq(employeeChildren.employeeId, id)),
      this.db.select().from(employeeNominees).where(eq(employeeNominees.employeeId, id)),
      this.db.select().from(employeeDocuments).where(eq(employeeDocuments.employeeId, id)),
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
    const cached = await this.cache.getByKey<any>(CacheKeys.employeeList, cacheKeyParts);
    if (cached) return cached;

    const conditions = [];

    if (status) conditions.push(eq(employees.status, status));
    if (departmentId) conditions.push(eq(employees.departmentId, departmentId));
    if (designationId) conditions.push(eq(employees.designationId, designationId));
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

    // Count
    const [totalRow] = await this.db
      .select({ count: count() })
      .from(employees)
      .where(where);

    const total = totalRow?.count ?? 0;

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
    const data = await this.db
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
        employeePhotoUrl: employees.employeePhotoUrl,
        createdAt: employees.createdAt,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(limit)
      .offset(offset);

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
  ): Promise<{ jobId: string; status: string; progress?: number; result?: any }> {
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
}
