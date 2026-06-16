import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { DB_CONNECTION, type Database } from '../../db';
import { providentFundSettings } from '../../db/schema';
import { UpdateProvidentFundSettingsDto } from './dto/provident-fund.dto';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys } from '../../common/cache/cache-keys';

@Injectable()
export class ProvidentFundService implements OnModuleInit {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
  ) {}

  async onModuleInit() {
    const settings = await this.db.select().from(providentFundSettings).limit(1);
    if (settings.length === 0) {
      await this.db.insert(providentFundSettings).values({
        minServiceMonths: 12,
        employeeContributionRate: 10,
        employerContributionRate: 10,
        contributionFrequency: 'monthly',
        calculationBasis: 'basic_salary',
        withdrawalRules: 'As per PF Trust Rules and Labour Law',
      });
    }
  }

  async find() {
    const cached = await this.cache.getByKey(CacheKeys.providentFundSettings);
    if (cached) return cached;

    const [settings] = await this.db.select().from(providentFundSettings).limit(1);
    
    if (settings) {
      await this.cache.setByKey(CacheKeys.providentFundSettings, settings);
    }
    
    return settings;
  }

  async update(dto: UpdateProvidentFundSettingsDto) {
    let settings = await this.find();
    if (!settings) {
      // Fallback seed just in case
      const [newSettings] = await this.db
        .insert(providentFundSettings)
        .values({
          minServiceMonths: dto.minServiceMonths ?? 12,
          employeeContributionRate: dto.employeeContributionRate ?? 10,
          employerContributionRate: dto.employerContributionRate ?? 10,
          contributionFrequency: dto.contributionFrequency ?? 'monthly',
          calculationBasis: dto.calculationBasis ?? 'basic_salary',
          withdrawalRules: dto.withdrawalRules ?? 'As per PF Trust Rules and Labour Law',
        })
        .returning();
      
      await this.invalidateCache();
      return newSettings;
    }

    const updateData: Record<string, any> = {};
    if (dto.minServiceMonths !== undefined) updateData.minServiceMonths = dto.minServiceMonths;
    if (dto.employeeContributionRate !== undefined) updateData.employeeContributionRate = dto.employeeContributionRate;
    if (dto.employerContributionRate !== undefined) updateData.employerContributionRate = dto.employerContributionRate;
    if (dto.contributionFrequency !== undefined) updateData.contributionFrequency = dto.contributionFrequency;
    if (dto.calculationBasis !== undefined) updateData.calculationBasis = dto.calculationBasis;
    if (dto.withdrawalRules !== undefined) updateData.withdrawalRules = dto.withdrawalRules;

    const [updated] = await this.db
      .update(providentFundSettings)
      .set(updateData)
      .returning();

    await this.invalidateCache();
    return updated;
  }

  // ─── Cache invalidation ──────────────────────────────────────────────────

  private async invalidateCache() {
    await this.cache.delByPattern(CacheKeys.providentFundSettings);
  }
}
