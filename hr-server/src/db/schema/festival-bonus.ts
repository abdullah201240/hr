import { pgTable, varchar, integer, boolean, jsonb, uuid, doublePrecision, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseTable } from './_base';
import { employees } from './employee';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

export const festivalBonusSettings = pgTable('festival_bonus_settings', {
  id: varchar('id', { length: 36 }).primaryKey(),
  bonusesPerYear: integer('bonuses_per_year').default(2).notNull(),
  minServiceMonths: integer('min_service_months').default(6).notNull(),
  amountFormula: varchar('amount_formula', { length: 50 }).default('one_month_basic').notNull(), // 'one_month_basic' | 'pro_rata_service_months' | 'prorated_service' | 'tiered_ranges'
  salaryComponent: varchar('salary_component', { length: 50 }).default('basic').notNull(), // 'basic' | 'gross'
  prorataFullServiceMonths: integer('prorata_full_service_months').default(12).notNull(),
  tierRules: jsonb('tier_rules')
    .default([])
    .notNull()
    .$type<Array<{ minMonths: number; maxMonths: number | null; percentage: number }>>(),
  eligibleEmployeeTypes: jsonb('eligible_employee_types')
    .default(['Full-time'])
    .notNull()
    .$type<string[]>(),
  allowSpecialApproval: boolean('allow_special_approval').default(true).notNull(),
});

export const festivalBonusCycles = pgTable('festival_bonus_cycles', {
  ...baseTable,
  name: varchar('name', { length: 100 }).notNull(),
  festivalDate: timestamp('festival_date', { withTimezone: true }).notNull(),
  status: varchar('status', { length: 30 }).default('Draft').notNull(), // 'Draft' | 'Approved' | 'Disbursed'
  totalAmount: doublePrecision('total_amount').default(0).notNull(),
  totalEmployees: integer('total_employees').default(0).notNull(),
});

export const employeeFestivalBonuses = pgTable('employee_festival_bonuses', {
  ...baseTable,
  festivalBonusCycleId: uuid('festival_bonus_cycle_id')
    .notNull()
    .references(() => festivalBonusCycles.id, { onDelete: 'cascade' }),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'cascade' }),
  basicSalary: doublePrecision('basic_salary').notNull(),
  grossSalary: doublePrecision('gross_salary').notNull(),
  serviceMonths: doublePrecision('service_months').notNull(),
  calculatedAmount: doublePrecision('calculated_amount').notNull(),
  overrideAmount: doublePrecision('override_amount'),
  finalAmount: doublePrecision('final_amount').notNull(),
  isEligible: boolean('is_eligible').default(true).notNull(),
  eligibilityReason: varchar('eligibility_reason', { length: 255 }),
  specialApprovalGranted: boolean('special_approval_granted').default(false).notNull(),
  specialApprovalBy: uuid('special_approval_by')
    .references((): AnyPgColumn => employees.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 30 }).default('Calculated').notNull(), // 'Calculated' | 'Paid'
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentRef: varchar('payment_ref', { length: 100 }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
}, (table) => ({
  cycleIdx: index('emp_fb_cycle_idx').on(table.festivalBonusCycleId),
  employeeIdx: index('emp_fb_employee_idx').on(table.employeeId),
}));

export const festivalBonusCyclesRelations = relations(festivalBonusCycles, ({ many }) => ({
  payouts: many(employeeFestivalBonuses),
}));

export const employeeFestivalBonusesRelations = relations(employeeFestivalBonuses, ({ one }) => ({
  cycle: one(festivalBonusCycles, {
    fields: [employeeFestivalBonuses.festivalBonusCycleId],
    references: [festivalBonusCycles.id],
  }),
  employee: one(employees, {
    fields: [employeeFestivalBonuses.employeeId],
    references: [employees.id],
  }),
}));
