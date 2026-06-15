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
import { designations, employees } from '../../db/schema';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys } from '../../common/cache/cache-keys';
import type {
  CreateDesignationDto,
  UpdateDesignationDto,
} from './dto/create-designation.dto';
import type { DesignationQueryDto } from './dto/designation-query.dto';

@Injectable()
export class DesignationService {
  private readonly logger = new Logger(DesignationService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
  ) {}

  // ─── Create ─────────────────────────────────────────────────────────────

  async create(dto: CreateDesignationDto) {
    return this.db.transaction(async (tx) => {
      // Check uniqueness of name and code
      const existing = await tx
        .select({ id: designations.id })
        .from(designations)
        .where(
          or(eq(designations.name, dto.name), eq(designations.code, dto.code)),
        )
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(
          `Designation with name "${dto.name}" or code "${dto.code}" already exists`,
        );
      }

      const [designation] = await tx
        .insert(designations)
        .values({
          name: dto.name,
          code: dto.code,
          description: dto.description || '',
          grade: dto.grade || '',
        })
        .returning();

      await this.invalidateListCache();

      this.logger.log(
        `Designation created: ${designation.name} (${designation.code})`,
      );
      return designation;
    });
  }

  // ─── Find all ────────────────────────────────────────────────────────────

  async findAll(query: DesignationQueryDto) {
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
      conditions.push(eq(designations.isActive, isActive));
    }

    if (search) {
      conditions.push(
        or(
          like(designations.name, `%${search}%`),
          like(designations.code, `%${search}%`),
          like(designations.grade, `%${search}%`),
        )!,
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Build a deterministic cache key from query params
    const cacheKeyParts = `${page}:${limit}:${search ?? ''}:${isActive ?? ''}:${sortBy}:${sortOrder}`;
    const cached = await this.cache.getByKey<any>(
      CacheKeys.designationListPaginated,
      cacheKeyParts,
    );
    if (cached) return cached;

    // Total count
    // Sort
    const sortColumns: Record<string, any> = {
      name: designations.name,
      code: designations.code,
      grade: designations.grade,
      createdAt: designations.createdAt,
    };
    const sortCol = sortColumns[sortBy] ?? designations.name;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    // Paginated query — run count + data in parallel for faster response
    const offset = (page - 1) * limit;
    const [[totalRow], data] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(designations)
        .where(where),
      this.db
        .select({
          id: designations.id,
          name: designations.name,
          code: designations.code,
          description: designations.description,
          grade: designations.grade,
          isActive: designations.isActive,
          createdAt: designations.createdAt,
          updatedAt: designations.updatedAt,
        })
        .from(designations)
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

    await this.cache.setByKey(
      CacheKeys.designationListPaginated,
      result,
      cacheKeyParts,
    );

    return result;
  }

  // ─── Find one ────────────────────────────────────────────────────────────

  async findOne(id: string) {
    const cached = await this.cache.getByKey<any>(CacheKeys.designationById, id);
    if (cached) return cached;

    const [designation] = await this.db
      .select()
      .from(designations)
      .where(eq(designations.id, id))
      .limit(1);

    if (!designation) {
      throw new NotFoundException(`Designation with ID "${id}" not found`);
    }

    // Get employee count for this designation
    const [empCount] = await this.db
      .select({ count: count() })
      .from(employees)
      .where(eq(employees.designationId, designation.id));

    const result = {
      ...designation,
      employeeCount: empCount?.count ?? 0,
    };

    await this.cache.setByKey(CacheKeys.designationById, result, id);
    return result;
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateDesignationDto) {
    return this.db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(designations)
        .where(eq(designations.id, id))
        .limit(1);

      if (!existing) {
        throw new NotFoundException(`Designation with ID "${id}" not found`);
      }

      // Check name/code uniqueness if being changed
      if (dto.name || dto.code) {
        const conflict = await tx
          .select({ id: designations.id })
          .from(designations)
          .where(
            and(
              or(
                dto.name ? eq(designations.name, dto.name) : undefined,
                dto.code ? eq(designations.code, dto.code) : undefined,
              ),
            ),
          )
          .limit(1);

        if (conflict.length > 0 && conflict[0].id !== id) {
          throw new ConflictException(
            `Another designation already uses this name or code`,
          );
        }
      }

      const updateData: Record<string, any> = {};

      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.code !== undefined) updateData.code = dto.code;
      if (dto.description !== undefined)
        updateData.description = dto.description;
      if (dto.grade !== undefined) updateData.grade = dto.grade;
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

      const [updated] = await tx
        .update(designations)
        .set(updateData)
        .where(eq(designations.id, id))
        .returning();

      await this.invalidateListCache(id);

      this.logger.log(`Designation updated: ${updated.name} (${updated.code})`);
      return updated;
    });
  }

  // ─── Delete (soft) ────────────────────────────────────────────────────────

  async remove(id: string) {
    const [existing] = await this.db
      .select()
      .from(designations)
      .where(eq(designations.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Designation with ID "${id}" not found`);
    }

    // Check if any active employees hold this designation
    const [empCount] = await this.db
      .select({ count: count() })
      .from(employees)
      .where(
        and(
          eq(employees.designationId, existing.id),
          eq(employees.status, 'active'),
        ),
      );

    if ((empCount?.count ?? 0) > 0) {
      throw new BadRequestException(
        `Cannot deactivate designation "${existing.name}": ${empCount.count} active employee(s) hold it. Reassign them first.`,
      );
    }

    await this.db
      .update(designations)
      .set({ isActive: false })
      .where(eq(designations.id, id));

    await this.invalidateListCache(id);

    this.logger.log(`Designation deactivated: ${existing.name}`);
    return { message: `Designation "${existing.name}" has been deactivated` };
  }

  // ─── Dropdown helper (for select inputs) ──────────────────────────────────

  async getDropdownOptions() {
    const cached = await this.cache.getByKey(CacheKeys.designationList);
    if (cached) return cached;

    const options = await this.db
      .select({
        id: designations.id,
        name: designations.name,
        code: designations.code,
        grade: designations.grade,
      })
      .from(designations)
      .where(eq(designations.isActive, true))
      .orderBy(asc(designations.name));

    await this.cache.setByKey(CacheKeys.designationList, options);
    return options;
  }

  // ─── Cache helpers ────────────────────────────────────────────────────────

  private async invalidateListCache(id?: string) {
    const promises: Promise<void>[] = [
      this.cache.delByPattern(CacheKeys.designationList),
      this.cache.delByPattern(CacheKeys.designationListPaginated),
    ];
    if (id) {
      promises.push(this.cache.delByKey(CacheKeys.designationById, id));
    }
    await Promise.all(promises);
  }
}
