import {
  pgTable,
  integer,
  doublePrecision,
  varchar,
  text,
  uuid,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseTable } from './_base';
import { employees } from './employee';

export const providentFundSettings = pgTable('provident_fund_settings', {
  ...baseTable,
  minServiceMonths: integer('min_service_months').default(12).notNull(),
  employeeContributionRate: doublePrecision('employee_contribution_rate').default(10).notNull(),
  employerContributionRate: doublePrecision('employer_contribution_rate').default(10).notNull(),
  contributionFrequency: varchar('contribution_frequency', { length: 50 }).default('monthly').notNull(),
  calculationBasis: varchar('calculation_basis', { length: 100 }).default('basic_salary').notNull(),
  withdrawalRules: text('withdrawal_rules').default('As per PF Trust Rules and Labour Law').notNull(),
});

export const providentFundTransactions = pgTable(
  'provident_fund_transactions',
  {
    ...baseTable,
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    monthKey: varchar('month_key', { length: 10 }), // Format "YYYY-MM" (null for one-off adjustments/withdrawals)
    employeeContribution: doublePrecision('employee_contribution').default(0).notNull(),
    employerContribution: doublePrecision('employer_contribution').default(0).notNull(),
    type: varchar('type', { length: 30 }).default('contribution').notNull(), // 'contribution' | 'withdrawal' | 'interest' | 'adjustment'
    amount: doublePrecision('amount').notNull(), // net transaction value (debit is negative, credit is positive)
    description: text('description').default('').notNull(),
  },
  (table) => [
    index('pf_transactions_employee_idx').on(table.employeeId),
    index('pf_transactions_month_key_idx').on(table.monthKey),
  ],
);

export const providentFundTransactionsRelations = relations(
  providentFundTransactions,
  ({ one }) => ({
    employee: one(employees, {
      fields: [providentFundTransactions.employeeId],
      references: [employees.id],
    }),
  }),
);

export const providentFundWithdrawals = pgTable(
  'provident_fund_withdrawals',
  {
    ...baseTable,
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    amount: doublePrecision('amount').notNull(),
    reason: text('reason').notNull(),
    status: varchar('status', { length: 20 }).default('Pending').notNull(), // 'Pending' | 'Approved' | 'Rejected'
    remarks: text('remarks').default('').notNull(),
    actionById: uuid('action_by_id').references(() => employees.id, { onDelete: 'set null' }),
    actionAt: timestamp('action_at', { withTimezone: true }),
  },
  (table) => [
    index('pf_withdrawals_employee_idx').on(table.employeeId),
    index('pf_withdrawals_status_idx').on(table.status),
  ],
);

export const providentFundWithdrawalsRelations = relations(
  providentFundWithdrawals,
  ({ one }) => ({
    employee: one(employees, {
      fields: [providentFundWithdrawals.employeeId],
      references: [employees.id],
      relationName: 'employeePFWithdrawals',
    }),
    actionBy: one(employees, {
      fields: [providentFundWithdrawals.actionById],
      references: [employees.id],
      relationName: 'actionByPFWithdrawals',
    }),
  }),
);
