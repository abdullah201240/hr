import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { eq, and, like, desc, asc, count } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import { leaveTypes } from '../../db/schema';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys } from '../../common/cache/cache-keys';
import type {
  CreateLeaveTypeDto,
  UpdateLeaveTypeDto,
} from './dto/create-leave-type.dto';
import type { LeaveTypeQueryDto } from './dto/leave-type-query.dto';

@Injectable()
export class LeaveTypeService {
  private readonly logger = new Logger(LeaveTypeService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
  ) {}

  // ─── Create ─────────────────────────────────────────────────────────────

  async create(dto: CreateLeaveTypeDto) {
    return this.db.transaction(async (tx) => {
      // Check uniqueness of name
      const existing = await tx
        .select({ id: leaveTypes.id })
        .from(leaveTypes)
        .where(eq(leaveTypes.name, dto.name))
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(
          `Leave type with name "${dto.name}" already exists`,
        );
      }

      const [leaveType] = await tx
        .insert(leaveTypes)
        .values({
          name: dto.name,
          icon: dto.icon || 'CalendarOff',
          color: dto.color || 'bg-sky-500',
          days: dto.days,
          paid: dto.paid ?? true,
          requiresApproval: dto.requiresApproval ?? true,
          requiresDocument: dto.requiresDocument ?? false,
          description: dto.description || '',
        })
        .returning();

      await this.invalidateCache();

      this.logger.log(`Leave type created: ${leaveType.name}`);
      return leaveType;
    });
  }

  // ─── Find all ────────────────────────────────────────────────────────────

  async findAll(query: LeaveTypeQueryDto) {
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
      conditions.push(eq(leaveTypes.isActive, isActive));
    }

    if (search) {
      conditions.push(like(leaveTypes.name, `%${search}%`));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Total count
    const [totalRow] = await this.db
      .select({ count: count() })
      .from(leaveTypes)
      .where(where);

    const total = totalRow?.count ?? 0;

    // Sort
    const sortColumns: Record<
      string,
      | typeof leaveTypes.name
      | typeof leaveTypes.days
      | typeof leaveTypes.createdAt
    > = {
      name: leaveTypes.name,
      days: leaveTypes.days,
      createdAt: leaveTypes.createdAt,
    };
    const sortCol = sortColumns[sortBy] ?? leaveTypes.name;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    // Paginated query
    const offset = (page - 1) * limit;
    const data = await this.db
      .select()
      .from(leaveTypes)
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

  // ─── Options (dropdown/active lists) ────────────────────────────────────

  async getDropdownOptions(): Promise<Array<typeof leaveTypes.$inferSelect>> {
    const cached = await this.cache.getByKey<
      Array<typeof leaveTypes.$inferSelect>
    >(CacheKeys.leaveTypes);
    if (cached) return cached;

    const options = await this.db
      .select()
      .from(leaveTypes)
      .where(eq(leaveTypes.isActive, true))
      .orderBy(asc(leaveTypes.name));

    await this.cache.setByKey(CacheKeys.leaveTypes, options);
    return options;
  }

  // ─── Find one ────────────────────────────────────────────────────────────

  async findOne(id: string) {
    const [leaveType] = await this.db
      .select()
      .from(leaveTypes)
      .where(eq(leaveTypes.id, id))
      .limit(1);

    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID "${id}" not found`);
    }

    return leaveType;
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateLeaveTypeDto) {
    return this.db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(leaveTypes)
        .where(eq(leaveTypes.id, id))
        .limit(1);

      if (!existing) {
        throw new NotFoundException(`Leave type with ID "${id}" not found`);
      }

      // Check name uniqueness if changed
      if (dto.name && dto.name !== existing.name) {
        const conflict = await tx
          .select({ id: leaveTypes.id })
          .from(leaveTypes)
          .where(eq(leaveTypes.name, dto.name))
          .limit(1);

        if (conflict.length > 0) {
          throw new ConflictException(
            `Another leave type already uses the name "${dto.name}"`,
          );
        }
      }

      const updateData: Record<string, any> = {};

      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.icon !== undefined) updateData.icon = dto.icon;
      if (dto.color !== undefined) updateData.color = dto.color;
      if (dto.days !== undefined) updateData.days = dto.days;
      if (dto.paid !== undefined) updateData.paid = dto.paid;
      if (dto.requiresApproval !== undefined)
        updateData.requiresApproval = dto.requiresApproval;
      if (dto.requiresDocument !== undefined)
        updateData.requiresDocument = dto.requiresDocument;
      if (dto.description !== undefined)
        updateData.description = dto.description;
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

      const [updated] = await tx
        .update(leaveTypes)
        .set(updateData)
        .where(eq(leaveTypes.id, id))
        .returning();

      await this.invalidateCache();

      this.logger.log(`Leave type updated: ${updated.name}`);
      return updated;
    });
  }

  // ─── Delete (soft delete / deactivate) ───────────────────────────────────

  async remove(id: string) {
    const [existing] = await this.db
      .select()
      .from(leaveTypes)
      .where(eq(leaveTypes.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Leave type with ID "${id}" not found`);
    }

    await this.db
      .update(leaveTypes)
      .set({ isActive: false })
      .where(eq(leaveTypes.id, id));

    await this.invalidateCache();

    this.logger.log(`Leave type deactivated: ${existing.name}`);
    return { message: `Leave type "${existing.name}" has been deactivated` };
  }

  // ─── Cache invalidation ──────────────────────────────────────────────────

  private async invalidateCache() {
    await this.cache.delByPattern(CacheKeys.leaveTypes);
  }
}
