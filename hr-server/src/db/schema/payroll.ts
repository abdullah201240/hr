import {
  pgTable,
  varchar,
  integer,
  doublePrecision,
  date,
  uuid,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseTable } from './_base';
import { employees } from './employee';

export const payrollCycles = pgTable(
  'payroll_cycles',
  {
    ...baseTable,
    monthKey: varchar('month_key', { length: 10 }).notNull(), // e.g. "2026-06"
    status: varchar('status', { length: 20 }).default('Draft').notNull(), // 'Draft' | 'Processed' | 'Distributed'
  },
  (table) => [
    uniqueIndex('payroll_cycles_month_key_idx').on(table.monthKey),
  ],
);

export const employeePayslips = pgTable(
  'employee_payslips',
  {
    ...baseTable,
    payrollCycleId: uuid('payroll_cycle_id')
      .notNull()
      .references(() => payrollCycles.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    
    basicSalary: doublePrecision('basic_salary').notNull(),
    allowanceHra: doublePrecision('allowance_hra').default(0).notNull(),
    allowanceTransport: doublePrecision('allowance_transport').default(0).notNull(),
    allowanceMedical: doublePrecision('allowance_medical').default(0).notNull(),
    
    deductionTax: doublePrecision('deduction_tax').default(0).notNull(),
    deductionPf: doublePrecision('deduction_pf').default(0).notNull(),
    
    bonusAmount: doublePrecision('bonus_amount').default(0).notNull(),
    bonusDescription: varchar('bonus_description', { length: 255 }).default('').notNull(),
    festivalBonusAmount: doublePrecision('festival_bonus_amount').default(0).notNull(),
    
    netPay: doublePrecision('net_pay').notNull(),
    paymentStatus: varchar('payment_status', { length: 20 }).default('Unpaid').notNull(), // 'Unpaid' | 'Paid'
    paymentMethod: varchar('payment_method', { length: 50 }),
    paymentDate: date('payment_date'),
    paymentReference: varchar('payment_reference', { length: 255 }),
  },
  (table) => [
    uniqueIndex('employee_payslips_cycle_employee_idx').on(table.payrollCycleId, table.employeeId),
    index('employee_payslips_employee_idx').on(table.employeeId),
  ],
);

export const disbursements = pgTable(
  'disbursements',
  {
    ...baseTable,
    monthKey: varchar('month_key', { length: 10 }).notNull(),
    disbursementDate: date('disbursement_date').notNull(),
    paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
    referenceId: varchar('reference_id', { length: 255 }).notNull(),
    totalDisbursed: doublePrecision('total_disbursed').notNull(),
    employeeCount: integer('employee_count').notNull(),
  },
  (table) => [
    index('disbursements_month_key_idx').on(table.monthKey),
  ],
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const payrollCyclesRelations = relations(payrollCycles, ({ many }) => ({
  payslips: many(employeePayslips),
}));

export const employeePayslipsRelations = relations(employeePayslips, ({ one }) => ({
  payrollCycle: one(payrollCycles, {
    fields: [employeePayslips.payrollCycleId],
    references: [payrollCycles.id],
  }),
  employee: one(employees, {
    fields: [employeePayslips.employeeId],
    references: [employees.id],
  }),
}));
