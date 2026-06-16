import {
  pgTable,
  integer,
  doublePrecision,
  boolean,
  varchar,
} from 'drizzle-orm/pg-core';
import { baseTable } from './_base';

export const festivalBonusRules = pgTable('festival_bonus_rules', {
  ...baseTable,
  minServiceMonths: integer('min_service_months').notNull(),
  maxServiceMonths: integer('max_service_months').notNull(),
  bonusPercentage: doublePrecision('bonus_percentage').notNull(),
  isProRata: boolean('is_pro_rata').default(false).notNull(),
  description: varchar('description', { length: 255 }),
});
