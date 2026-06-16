import { Injectable, Inject, OnModuleInit, NotFoundException } from '@nestjs/common';
import { eq, asc } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import { festivalBonusRules } from '../../db/schema';
import { CreateFestivalBonusRuleDto, UpdateFestivalBonusRuleDto } from './dto/festival-bonus.dto';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys } from '../../common/cache/cache-keys';

@Injectable()
export class FestivalBonusService implements OnModuleInit {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
  ) {}

  async onModuleInit() {
    const rules = await this.db.select().from(festivalBonusRules).limit(1);
    if (rules.length === 0) {
      await this.db.insert(festivalBonusRules).values([
        {
          minServiceMonths: 0,
          maxServiceMonths: 5,
          bonusPercentage: 0,
          isProRata: true,
          description: 'Not eligible unless specially approved (pro-rata)',
        },
        {
          minServiceMonths: 6,
          maxServiceMonths: 999,
          bonusPercentage: 100,
          isProRata: false,
          description: 'One Month Basic Salary',
        },
      ]);
    }
  }

  async findAll() {
    const cached = await this.cache.getByKey(CacheKeys.festivalBonusRules);
    if (cached) return cached;

    const rules = await this.db
      .select()
      .from(festivalBonusRules)
      .orderBy(asc(festivalBonusRules.minServiceMonths));

    await this.cache.setByKey(CacheKeys.festivalBonusRules, rules);
    return rules;
  }

  async findOne(id: string) {
    const cached = await this.cache.getByKey(CacheKeys.festivalBonusRuleById, id);
    if (cached) return cached;

    const [rule] = await this.db
      .select()
      .from(festivalBonusRules)
      .where(eq(festivalBonusRules.id, id))
      .limit(1);

    if (!rule) {
      throw new NotFoundException(`Festival bonus rule with ID "${id}" not found`);
    }

    await this.cache.setByKey(CacheKeys.festivalBonusRuleById, rule, id);
    return rule;
  }

  async create(dto: CreateFestivalBonusRuleDto) {
    const [created] = await this.db
      .insert(festivalBonusRules)
      .values({
        minServiceMonths: dto.minServiceMonths,
        maxServiceMonths: dto.maxServiceMonths,
        bonusPercentage: dto.bonusPercentage,
        isProRata: dto.isProRata ?? false,
        description: dto.description || null,
      })
      .returning();

    await this.invalidateCache();
    return created;
  }

  async update(id: string, dto: UpdateFestivalBonusRuleDto) {
    await this.findOne(id);

    const updateData: Record<string, any> = {};
    if (dto.minServiceMonths !== undefined) updateData.minServiceMonths = dto.minServiceMonths;
    if (dto.maxServiceMonths !== undefined) updateData.maxServiceMonths = dto.maxServiceMonths;
    if (dto.bonusPercentage !== undefined) updateData.bonusPercentage = dto.bonusPercentage;
    if (dto.isProRata !== undefined) updateData.isProRata = dto.isProRata;
    if (dto.description !== undefined) updateData.description = dto.description;

    const [updated] = await this.db
      .update(festivalBonusRules)
      .set(updateData)
      .where(eq(festivalBonusRules.id, id))
      .returning();

    await this.invalidateCache(id);
    return updated;
  }

  async delete(id: string) {
    const rule = await this.findOne(id);
    await this.db.delete(festivalBonusRules).where(eq(festivalBonusRules.id, id));
    
    await this.invalidateCache(id);
    return { message: `Festival bonus rule "${(rule as any).description || id}" has been deleted` };
  }

  // ─── Cache invalidation ──────────────────────────────────────────────────

  private async invalidateCache(id?: string) {
    const promises: Promise<void>[] = [
      this.cache.delByPattern(CacheKeys.festivalBonusRules),
    ];
    if (id) {
      promises.push(this.cache.delByKey(CacheKeys.festivalBonusRuleById, id));
    }
    await Promise.all(promises);
  }
}
