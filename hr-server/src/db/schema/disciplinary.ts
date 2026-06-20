import { pgTable, varchar, text, date } from 'drizzle-orm/pg-core';
import { baseTable } from './_base';

export const disciplinaryCases = pgTable('disciplinary_cases', {
  ...baseTable,
  id: varchar('id', { length: 50 }).primaryKey(),
  employeeName: varchar('employee_name', { length: 255 }).notNull(),
  employeeEmail: varchar('employee_email', { length: 255 }).notNull(),
  offenseType: varchar('offense_type', { length: 255 }).notNull(),
  dateReported: date('date_reported').notNull(),
  status: varchar('status', { length: 100 }).notNull(),
  showCauseNotice: text('show_cause_notice').default(''),
  employeeExplanation: text('employee_explanation').default(''),
  finalAction: text('final_action').default(''),
});
