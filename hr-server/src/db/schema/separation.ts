import { pgTable, varchar, text, date, boolean, numeric } from 'drizzle-orm/pg-core';
import { baseTable } from './_base';

export const separationRecords = pgTable('separation_records', {
  ...baseTable,
  id: varchar('id', { length: 50 }).primaryKey(),
  employeeName: varchar('employee_name', { length: 255 }).notNull(),
  employeeEmail: varchar('employee_email', { length: 255 }).notNull(),
  department: varchar('department', { length: 255 }).notNull(),
  lastWorkingDay: date('last_working_day').notNull(),
  reason: text('reason').default(''),
  status: varchar('status', { length: 100 }).notNull(),
  clearanceIt: boolean('clearance_it').default(false).notNull(),
  clearanceFinance: boolean('clearance_finance').default(false).notNull(),
  clearanceHr: boolean('clearance_hr').default(false).notNull(),
  clearanceManager: boolean('clearance_manager').default(false).notNull(),
  assetLaptop: boolean('asset_laptop').default(false).notNull(),
  assetAccessCard: boolean('asset_access_card').default(false).notNull(),
  assetKeys: boolean('asset_keys').default(false).notNull(),
  assetOther: boolean('asset_other').default(false).notNull(),
  handoverCompleted: boolean('handover_completed').default(false).notNull(),
});

export const finalSettlements = pgTable('final_settlements', {
  ...baseTable,
  id: varchar('id', { length: 50 }).primaryKey(),
  separationRecordId: varchar('separation_record_id', { length: 50 })
    .notNull()
    .references(() => separationRecords.id, { onDelete: 'cascade' }),
  employeeEmail: varchar('employee_email', { length: 255 }).notNull(),
  separationType: varchar('separation_type', { length: 50 }).notNull(), // 'Retirement' | 'Resignation' | 'Termination' | 'Dismissal'
  serviceYears: numeric('service_years').notNull(),
  payableDays: numeric('payable_days').notNull(),
  encashableAlDays: numeric('encashable_al_days').notNull(),
  
  // Earnings
  salaryPayable: numeric('salary_payable').notNull(),
  separationBenefit: numeric('separation_benefit').notNull(),
  leaveEncashment: numeric('leave_encashment').notNull(),
  festivalBonusAdjustment: numeric('festival_bonus_adjustment').notNull(),
  employeePfBalance: numeric('employee_pf_balance').notNull(),
  employerPfBalance: numeric('employer_pf_balance').notNull(),
  pfInterest: numeric('pf_interest').notNull(),
  medicalReimbursement: numeric('medical_reimbursement').notNull(),
  wellnessAllowance: numeric('wellness_allowance').notNull(),
  otherReimbursements: numeric('other_reimbursements').notNull(),
  
  // Deductions / Recoveries
  salaryAdvanceRecovery: numeric('salary_advance_recovery').notNull(),
  loanRecovery: numeric('loan_recovery').notNull(),
  noticePayRecovery: numeric('notice_pay_recovery').notNull(),
  assetRecovery: numeric('asset_recovery').notNull(),
  taxAdjustment: numeric('tax_adjustment').notNull(),
  otherCompanyDues: numeric('other_company_dues').notNull(),
  
  // Net
  netSettlementAmount: numeric('net_settlement_amount').notNull(),
  
  status: varchar('status', { length: 50 }).default('Draft').notNull(), // 'Draft' | 'Approved' | 'Paid'
  paymentDetails: text('payment_details').default(''),
});
