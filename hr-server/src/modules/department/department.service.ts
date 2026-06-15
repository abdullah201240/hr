import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import { departments, employees } from '../../db/schema';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys } from '../../common/cache/cache-keys';
import type { CreateDepartmentDto, UpdateDepartmentDto } from './dto/create-department.dto';
import type { DepartmentQueryDto } from './dto/department-query.dto';

@Injectable()
export class DepartmentService {
  private readonly logger = new Logger(DepartmentService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
  ) {}

  // ─── Create ─────────────────────────────────────────────────────────────

  async create(dto: CreateDepartmentDto) {
    return this.db.transaction(async (tx) => {
      // Check uniqueness of name and code
      const existing = await tx
        .select({ id: departments.id })
        .from(departments)
        .where(
          or(
            eq(departments.name, dto.name),
            eq(departments.code, dto.code),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(
          `Department with name "${dto.name}" or code "${dto.code}" already exists`,
        );
      }

      // Validate head employee exists (if provided)
      if (dto.headEmployeeId) {
        const [head] = await tx
          .select({ id: employees.id })
          .from(employees)
          .where(eq(employees.id, dto.headEmployeeId))
          .limit(1);

        if (!head) {
          throw new BadRequestException(
            `Head employee with ID "${dto.headEmployeeId}" not found`,
          );
        }
      }

      const [department] = await tx
        .insert(departments)
        .values({
          name: dto.name,
          code: dto.code,
          description: dto.description || '',
          headEmployeeId: dto.headEmployeeId || null,
        })
        .returning();

      await this.invalidateListCache();

      this.logger.log(`Department created: ${department!.name} (${department!.code})`);
      return department!;
    });
  }

  // ─── Find all ────────────────────────────────────────────────────────────

  async findAll(query: DepartmentQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const conditions = [];

    if (isActive !== undefined) {
      conditions.push(eq(departments.isActive, isActive));
    }

    if (search) {
      conditions.push(
        or(
          like(departments.name, `%${search}%`),
          like(departments.code, `%${search}%`),
        )!,
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Build a deterministic cache key from query params
    const cacheKeyParts = `${page}:${limit}:${search ?? ''}:${isActive ?? ''}:${sortBy}:${sortOrder}`;
    const cached = await this.cache.getByKey<any>(CacheKeys.departmentListPaginated, cacheKeyParts);
    if (cached) return cached;

    // Sort
    const sortColumns: Record<string, any> = {
      name: departments.name,
      code: departments.code,
      createdAt: departments.createdAt,
    };
    const sortCol = sortColumns[sortBy] ?? departments.name;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    // Paginated query
    const offset = (page - 1) * limit;

    // Run count + data in parallel for faster response
    const [[totalRow], data] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(departments)
        .where(where),
      this.db
        .select({
          id: departments.id,
          name: departments.name,
          code: departments.code,
          description: departments.description,
          headEmployeeId: departments.headEmployeeId,
          isActive: departments.isActive,
          createdAt: departments.createdAt,
          updatedAt: departments.updatedAt,
        })
        .from(departments)
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

    await this.cache.setByKey(CacheKeys.departmentListPaginated, result, cacheKeyParts);

    return result;
  }

  // ─── Find one ────────────────────────────────────────────────────────────

  async findOne(id: string) {
    const [department] = await this.db
      .select()
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);

    if (!department) {
      throw new NotFoundException(`Department with ID "${id}" not found`);
    }

    // Get employee count for this department
    const [empCount] = await this.db
      .select({ count: count() })
      .from(employees)
      .where(eq(employees.departmentId, department.id));

    return {
      ...department,
      employeeCount: empCount?.count ?? 0,
    };
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateDepartmentDto) {
    return this.db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(departments)
        .where(eq(departments.id, id))
        .limit(1);

      if (!existing) {
        throw new NotFoundException(`Department with ID "${id}" not found`);
      }

      // Check name/code uniqueness if being changed
      if (dto.name || dto.code) {
        const conflict = await tx
          .select({ id: departments.id })
          .from(departments)
          .where(
            and(
              or(
                dto.name ? eq(departments.name, dto.name) : undefined,
                dto.code ? eq(departments.code, dto.code) : undefined,
              ),
            ),
          )
          .limit(1);

        // Filter out self-match
        if (conflict.length > 0 && conflict[0]!.id !== id) {
          throw new ConflictException(
            `Another department already uses this name or code`,
          );
        }
      }

      // Validate head employee (if being changed)
      if (dto.headEmployeeId) {
        const [head] = await tx
          .select({ id: employees.id })
          .from(employees)
          .where(eq(employees.id, dto.headEmployeeId))
          .limit(1);

        if (!head) {
          throw new BadRequestException(
            `Head employee with ID "${dto.headEmployeeId}" not found`,
          );
        }
      }

      const updateData: Record<string, any> = {};

      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.code !== undefined) updateData.code = dto.code;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.headEmployeeId !== undefined) updateData.headEmployeeId = dto.headEmployeeId || null;
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

      const [updated] = await tx
        .update(departments)
        .set(updateData)
        .where(eq(departments.id, id))
        .returning();

      await this.invalidateListCache();

      this.logger.log(`Department updated: ${updated!.name} (${updated!.code})`);
      return updated!;
    });
  }

  // ─── Delete (soft) ────────────────────────────────────────────────────────

  async remove(id: string) {
    const [existing] = await this.db
      .select()
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Department with ID "${id}" not found`);
    }

    // Check if any active employees belong to this department
    const [empCount] = await this.db
      .select({ count: count() })
      .from(employees)
      .where(
        and(
          eq(employees.departmentId, existing.id),
          eq(employees.status, 'active'),
        ),
      );

    if ((empCount?.count ?? 0) > 0) {
      throw new BadRequestException(
        `Cannot deactivate department "${existing.name}": ${empCount!.count} active employee(s) assigned. Reassign them first.`,
      );
    }

    await this.db
      .update(departments)
      .set({ isActive: false })
      .where(eq(departments.id, id));

    await this.invalidateListCache();

    this.logger.log(`Department deactivated: ${existing.name}`);
    return { message: `Department "${existing.name}" has been deactivated` };
  }

  // ─── Dropdown helper (for select inputs) ──────────────────────────────────

  async getDropdownOptions() {
    const cached = await this.cache.getByKey(CacheKeys.departmentList);
    if (cached) return cached;

    const options = await this.db
      .select({
        id: departments.id,
        name: departments.name,
        code: departments.code,
      })
      .from(departments)
      .where(eq(departments.isActive, true))
      .orderBy(asc(departments.name));

    await this.cache.setByKey(CacheKeys.departmentList, options);
    return options;
  }

  // ─── Cache helpers ────────────────────────────────────────────────────────

  private async invalidateListCache() {
    await Promise.all([
      this.cache.delByPattern(CacheKeys.departmentList),
      this.cache.delByPattern(CacheKeys.departmentListPaginated),
    ]);
  }
}
