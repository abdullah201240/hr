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
  boolean,
  jsonb,
  text,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseTable } from './_base';
import { employees } from './employee';

export const payrollCycles = pgTable(
  'payroll_cycles',
  {
    ...baseTable,
    monthKey: varchar('month_key', { length: 10 }).notNull(), // e.g. "2026-06"
    status: varchar('status', { length: 30 }).default('Draft').notNull(), // 'Draft' | 'Awaiting_LM_Approval' | 'Awaiting_MD_Approval' | 'Awaiting_Disbursement' | 'Disbursed'
    isProcessing: boolean('is_processing').default(false).notNull(),
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
    
    netPay: doublePrecision('net_pay').notNull(),
    paymentStatus: varchar('payment_status', { length: 20 }).default('Unpaid').notNull(), // 'Unpaid' | 'Paid'
    paymentMethod: varchar('payment_method', { length: 50 }),
    paymentDate: date('payment_date'),
    paymentReference: varchar('payment_reference', { length: 255 }),
    allowances: jsonb('allowances').$type<Record<string, number>>().default({}).notNull(),
    deductions: jsonb('deductions').$type<Record<string, number>>().default({}).notNull(),

    // Attendance-based metrics for payroll period
    totalWorkingDays: integer('total_working_days').default(0).notNull(),
    presentDays: integer('present_days').default(0).notNull(),
    absentDays: integer('absent_days').default(0).notNull(),
    leaveDays: integer('leave_days').default(0).notNull(),
    lateDays: integer('late_days').default(0).notNull(),

    // Approval Workflow tracking
    status: varchar('status', { length: 30 }).default('Draft').notNull(), // 'Draft' | 'Awaiting_LM_Approval' | 'Awaiting_MD_Approval' | 'Awaiting_Disbursement' | 'Disbursed' | 'Rejected'
    rejectionReason: text('rejection_reason'),
    lmApprovedById: uuid('lm_approved_by_id').references(() => employees.id, { onDelete: 'set null' }),
    lmApprovedAt: timestamp('lm_approved_at', { withTimezone: true }),
    mdApprovedById: uuid('md_approved_by_id').references(() => employees.id, { onDelete: 'set null' }),
    mdApprovedAt: timestamp('md_approved_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('employee_payslips_cycle_employee_idx').on(table.payrollCycleId, table.employeeId),
    index('employee_payslips_employee_idx').on(table.employeeId),
    index('employee_payslips_status_idx').on(table.status),
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

export const payrollApprovals = pgTable(
  'payroll_approvals',
  {
    ...baseTable,
    payrollCycleId: uuid('payroll_cycle_id')
      .notNull()
      .references(() => payrollCycles.id, { onDelete: 'cascade' }),
    employeePayslipId: uuid('employee_payslip_id')
      .references(() => employeePayslips.id, { onDelete: 'cascade' }),
    stage: varchar('stage', { length: 50 }).notNull(), // 'LineManager' | 'MD' | 'Accounts'
    status: varchar('status', { length: 50 }).notNull(), // 'Approved' | 'Rejected'
    comment: text('comment'),
    actionById: uuid('action_by_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'restrict' }),
    actionAt: timestamp('action_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('payroll_approvals_cycle_idx').on(table.payrollCycleId),
    index('payroll_approvals_payslip_idx').on(table.employeePayslipId),
  ],
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const payrollCyclesRelations = relations(payrollCycles, ({ many }) => ({
  payslips: many(employeePayslips),
  approvals: many(payrollApprovals),
}));

export const employeePayslipsRelations = relations(employeePayslips, ({ one, many }) => ({
  payrollCycle: one(payrollCycles, {
    fields: [employeePayslips.payrollCycleId],
    references: [payrollCycles.id],
  }),
  employee: one(employees, {
    fields: [employeePayslips.employeeId],
    references: [employees.id],
  }),
  approvals: many(payrollApprovals),
  lmApprover: one(employees, {
    fields: [employeePayslips.lmApprovedById],
    references: [employees.id],
    relationName: 'lmApprover',
  }),
  mdApprover: one(employees, {
    fields: [employeePayslips.mdApprovedById],
    references: [employees.id],
    relationName: 'mdApprover',
  }),
}));

export const payrollApprovalsRelations = relations(payrollApprovals, ({ one }) => ({
  payrollCycle: one(payrollCycles, {
    fields: [payrollApprovals.payrollCycleId],
    references: [payrollCycles.id],
  }),
  employeePayslip: one(employeePayslips, {
    fields: [payrollApprovals.employeePayslipId],
    references: [employeePayslips.id],
  }),
  actionBy: one(employees, {
    fields: [payrollApprovals.actionById],
    references: [employees.id],
  }),
}));
