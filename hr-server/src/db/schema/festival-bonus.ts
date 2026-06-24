import { pgTable, varchar, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

export const festivalBonusSettings = pgTable('festival_bonus_settings', {
  id: varchar('id', { length: 36 }).primaryKey(),
  bonusesPerYear: integer('bonuses_per_year').default(2).notNull(),
  minServiceMonths: integer('min_service_months').default(6).notNull(),
  amountFormula: varchar('amount_formula', { length: 50 }).default('one_month_basic').notNull(), // 'one_month_basic' | 'pro_rata_service_months'
  eligibleEmployeeTypes: jsonb('eligible_employee_types')
    .default(['Permanent'])
    .notNull()
    .$type<string[]>(),
  allowSpecialApproval: boolean('allow_special_approval').default(true).notNull(),
});
