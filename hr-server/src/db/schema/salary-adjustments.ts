import {
  pgTable,
  varchar,
  doublePrecision,
  uuid,
  text,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseTable } from './_base';
import { employees } from './employee';
import { payrollCycles, employeePayslips } from './payroll';

// Salary adjustments table - for retroactive corrections across months
export const salaryAdjustments = pgTable(
  'salary_adjustments',
  {
    ...baseTable,
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    
    // The month this adjustment applies TO (e.g., adjusting May salary)
    targetMonthKey: varchar('target_month_key', { length: 10 }).notNull(),
    
    // The month this adjustment will be APPLIED IN (e.g., June payroll)
    appliedMonthKey: varchar('applied_month_key', { length: 10 }).notNull(),
    
    adjustmentType: varchar('adjustment_type', { length: 20 }).notNull(), 
    // 'addition' | 'deduction' | 'partial_salary'
    
    amount: doublePrecision('amount').notNull(),
    
    reason: text('reason').notNull(),
    // e.g., "Partial salary for May (1-15)", "May overpayment recovery"
    
    // Reference to original payslip if adjusting a specific month
    originalPayslipId: uuid('original_payslip_id')
      .references(() => employeePayslips.id, { onDelete: 'set null' }),
    
    // Metadata for partial salary calculations
    metadata: jsonb('metadata').$type<{
      startDay?: number;
      endDay?: number;
      startDate?: string;
      endDate?: string;
      paidDays?: number;
      totalDaysInMonth?: number;
      unpaidDays?: number;
      originalNetPay?: number;
      prorationMode?: 'dayRange' | 'dateRange' | 'paidDays';
    }>().default({}),
    
    status: varchar('status', { length: 20 }).default('Pending').notNull(),
    // 'Pending' | 'Applied' | 'Cancelled'
  },
  (table) => [
    index('salary_adjustments_employee_idx').on(table.employeeId),
    index('salary_adjustments_target_month_idx').on(table.targetMonthKey),
    index('salary_adjustments_applied_month_idx').on(table.appliedMonthKey),
    index('salary_adjustments_status_idx').on(table.status),
  ],
);

// Relations
export const salaryAdjustmentsRelations = relations(salaryAdjustments, ({ one }) => ({
  employee: one(employees, {
    fields: [salaryAdjustments.employeeId],
    references: [employees.id],
  }),
  targetCycle: one(payrollCycles, {
    fields: [salaryAdjustments.targetMonthKey],
    references: [payrollCycles.monthKey],
  }),
  appliedCycle: one(payrollCycles, {
    fields: [salaryAdjustments.appliedMonthKey],
    references: [payrollCycles.monthKey],
  }),
}));
