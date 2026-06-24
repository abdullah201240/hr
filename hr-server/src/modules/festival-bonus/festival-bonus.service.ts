import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import { festivalBonusSettings } from '../../db/schema';
import { UpdateFestivalBonusSettingsDto } from './dto/festival-bonus-settings.dto';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys } from '../../common/cache/cache-keys';

const SINGLETON_ID = 'default';

@Injectable()
export class FestivalBonusService {
  private readonly logger = new Logger(FestivalBonusService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
  ) {}

  async getSettings() {
    const cached = await this.cache.getByKey<typeof festivalBonusSettings.$inferSelect>(
      CacheKeys.festivalBonusSettings,
    );
    if (cached) return cached;

    let [settings] = await this.db
      .select()
      .from(festivalBonusSettings)
      .where(eq(festivalBonusSettings.id, SINGLETON_ID))
      .limit(1);

    if (!settings) {
      [settings] = await this.db
        .insert(festivalBonusSettings)
        .values({
          id: SINGLETON_ID,
          bonusesPerYear: 2,
          minServiceMonths: 6,
          amountFormula: 'one_month_basic',
          eligibleEmployeeTypes: ['Permanent'],
          allowSpecialApproval: true,
        })
        .returning();
      this.logger.log('Initialized default festival bonus settings');
    }

    await this.cache.setByKey(CacheKeys.festivalBonusSettings, settings);
    return settings;
  }

  async updateSettings(dto: UpdateFestivalBonusSettingsDto) {
    // Ensure settings exist first
    await this.getSettings();

    const [updated] = await this.db
      .update(festivalBonusSettings)
      .set({
        ...dto,
      })
      .where(eq(festivalBonusSettings.id, SINGLETON_ID))
      .returning();

    await this.cache.setByKey(CacheKeys.festivalBonusSettings, updated);
    this.logger.log('Updated festival bonus settings');
    return updated;
  }
}
