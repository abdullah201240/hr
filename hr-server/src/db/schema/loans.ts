import {
  pgTable,
  varchar,
  integer,
  doublePrecision,
  uuid,
  timestamp,
  text,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseTable } from './_base';
import { employees } from './employee';
import { employeePayslips } from './payroll';

export const loans = pgTable('loans', {
  ...baseTable,
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'cascade' }),
  amount: doublePrecision('amount').notNull(),
  reason: text('reason').notNull(),
  interestRate: doublePrecision('interest_rate').default(0).notNull(), // default 0% interest
  termMonths: integer('term_months').notNull(), // repayment period (months)
  monthlyInstallment: doublePrecision('monthly_installment').notNull(), // monthly installment EMI
  remainingBalance: doublePrecision('remaining_balance').notNull(),
  status: varchar('status', { length: 30 }).default('Pending').notNull(), // 'Pending' | 'Approved' | 'Disbursed' | 'Rejected' | 'Repaid'
  approvedById: uuid('approved_by_id').references(() => employees.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  disbursedById: uuid('disbursed_by_id').references(() => employees.id, { onDelete: 'set null' }),
  disbursedAt: timestamp('disbursed_at', { withTimezone: true }),
  remarks: text('remarks'),
});

export const loanPayments = pgTable('loan_payments', {
  ...baseTable,
  loanId: uuid('loan_id')
    .notNull()
    .references(() => loans.id, { onDelete: 'cascade' }),
  payslipId: uuid('payslip_id')
    .references(() => employeePayslips.id, { onDelete: 'set null' }),
  amount: doublePrecision('amount').notNull(),
  paymentDate: timestamp('payment_date', { withTimezone: true }).defaultNow().notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // 'Salary Deduction' | 'Bank Transfer' | 'Cash'
  remarks: text('remarks'),
});

// Relations
export const loansRelations = relations(loans, ({ one, many }) => ({
  employee: one(employees, {
    fields: [loans.employeeId],
    references: [employees.id],
  }),
  approvedBy: one(employees, {
    fields: [loans.approvedById],
    references: [employees.id],
    relationName: 'loanApprovedBy',
  }),
  disbursedBy: one(employees, {
    fields: [loans.disbursedById],
    references: [employees.id],
    relationName: 'loanDisbursedBy',
  }),
  payments: many(loanPayments),
}));

export const loanPaymentsRelations = relations(loanPayments, ({ one }) => ({
  loan: one(loans, {
    fields: [loanPayments.loanId],
    references: [loans.id],
  }),
  payslip: one(employeePayslips, {
    fields: [loanPayments.payslipId],
    references: [employeePayslips.id],
  }),
}));
