import { pgTable, varchar, text, date, boolean } from 'drizzle-orm/pg-core';
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
