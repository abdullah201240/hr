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
          clause: dto.clause ?? null,
          carryForward: dto.carryForward ?? false,
          maxCarryOverDays: dto.maxCarryOverDays ?? null,
          encashment: dto.encashment ?? false,
          encashmentPercent: dto.encashmentPercent ?? null,
          isProRata: dto.isProRata ?? false,
          sandwichRule: dto.sandwichRule ?? false,
          compLeaveExpiryDays: dto.compLeaveExpiryDays ?? null,
          eligibility: dto.eligibility ?? null,
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

    // Build a deterministic cache key from query params
    const cacheKeyParts = `${page}:${limit}:${search ?? ''}:${isActive ?? ''}:${sortBy}:${sortOrder}`;
    const cached = await this.cache.getByKey<any>(
      CacheKeys.leaveTypeListPaginated,
      cacheKeyParts,
    );
    if (cached) return cached;

    // Total count
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

    // Paginated query — run count + data in parallel for faster response
    const offset = (page - 1) * limit;
    const [[totalRow], data] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(leaveTypes)
        .where(where),
      this.db
        .select()
        .from(leaveTypes)
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
      CacheKeys.leaveTypeListPaginated,
      result,
      cacheKeyParts,
    );

    return result;
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
    const cached = await this.cache.getByKey<any>(CacheKeys.leaveTypeById, id);
    if (cached) return cached;

    const [leaveType] = await this.db
      .select()
      .from(leaveTypes)
      .where(eq(leaveTypes.id, id))
      .limit(1);

    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID "${id}" not found`);
    }

    await this.cache.setByKey(CacheKeys.leaveTypeById, leaveType, id);
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
      if (dto.clause !== undefined) updateData.clause = dto.clause;
      if (dto.carryForward !== undefined) updateData.carryForward = dto.carryForward;
      if (dto.maxCarryOverDays !== undefined) updateData.maxCarryOverDays = dto.maxCarryOverDays;
      if (dto.encashment !== undefined) updateData.encashment = dto.encashment;
      if (dto.encashmentPercent !== undefined) updateData.encashmentPercent = dto.encashmentPercent;
      if (dto.isProRata !== undefined) updateData.isProRata = dto.isProRata;
      if (dto.sandwichRule !== undefined) updateData.sandwichRule = dto.sandwichRule;
      if (dto.compLeaveExpiryDays !== undefined) updateData.compLeaveExpiryDays = dto.compLeaveExpiryDays;
      if (dto.eligibility !== undefined) updateData.eligibility = dto.eligibility;
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

      const [updated] = await tx
        .update(leaveTypes)
        .set(updateData)
        .where(eq(leaveTypes.id, id))
        .returning();

      await this.invalidateCache(id);

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

    await this.invalidateCache(id);

    this.logger.log(`Leave type deactivated: ${existing.name}`);
    return { message: `Leave type "${existing.name}" has been deactivated` };
  }

  // ─── Cache invalidation ──────────────────────────────────────────────────

  private async invalidateCache(id?: string) {
    const promises: Promise<void>[] = [
      this.cache.delByPattern(CacheKeys.leaveTypes),
      this.cache.delByPattern(CacheKeys.leaveTypeListPaginated),
    ];
    if (id) {
      promises.push(this.cache.delByKey(CacheKeys.leaveTypeById, id));
    }
    await Promise.all(promises);
  }
}
