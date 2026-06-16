import {
  pgTable,
  integer,
  doublePrecision,
  varchar,
  text,
} from 'drizzle-orm/pg-core';
import { baseTable } from './_base';

export const providentFundSettings = pgTable('provident_fund_settings', {
  ...baseTable,
  minServiceMonths: integer('min_service_months').default(12).notNull(),
  employeeContributionRate: doublePrecision('employee_contribution_rate').default(10).notNull(),
  employerContributionRate: doublePrecision('employer_contribution_rate').default(10).notNull(),
  contributionFrequency: varchar('contribution_frequency', { length: 50 }).default('monthly').notNull(),
  calculationBasis: varchar('calculation_basis', { length: 100 }).default('basic_salary').notNull(),
  withdrawalRules: text('withdrawal_rules').default('As per PF Trust Rules and Labour Law').notNull(),
});
