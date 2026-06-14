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
import { DB_CONNECTION, type Database } from '../../db/index.js';
import {
  employees,
  employeeSpouses,
  employeeChildren,
  employeeNominees,
  employeeBankDetails,
  employeeDocuments,
} from '../../db/schema/index.js';
import { REDIS_CLIENT } from '../../common/cache/cache.service.js';
import type Redis from 'ioredis';
import {
  EMPLOYEE_CREATE_QUEUE,
  EMPLOYEE_UPDATE_QUEUE,
} from '../queue/queue.module.js';
import type { CreateEmployeeDto } from './dto/create-employee.dto.js';
import type { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import type { EmployeeQueryDto } from './dto/employee-query.dto.js';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
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
    const cacheKey = `employee:by-id:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const [employee] = await this.db
      .select()
      .from(employees)
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

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(result));

    return result;
  }

  // ─── Find all with filters & pagination ─────────────────────────────────

  async findAll(query: EmployeeQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      department,
      designation,
      status = 'active',
      employeeType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const conditions = [];

    if (status) conditions.push(eq(employees.status, status));
    if (department) conditions.push(eq(employees.department, department));
    if (designation) conditions.push(eq(employees.designation, designation));
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

    // Paginated query
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
        department: employees.department,
        designation: employees.designation,
        employeeType: employees.employeeType,
        joinDate: employees.joinDate,
        status: employees.status,
        employeePhotoUrl: employees.employeePhotoUrl,
        createdAt: employees.createdAt,
      })
      .from(employees)
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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
        updatedAt: new Date(),
      })
      .where(eq(employees.id, id));

    // Invalidate cache
    await this.redis.del(`employee:by-id:${id}`);

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
