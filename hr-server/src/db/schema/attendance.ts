import {
  pgTable,
  varchar,
  integer,
  jsonb,
  date,
  uuid,
  doublePrecision,
  index,
  uniqueIndex,
  numeric,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseTable } from './_base';
import { employees } from './employee';

// ─── Attendance Settings (singleton — one row) ────────────────────────────

export const attendanceSettings = pgTable('attendance_settings', {
  id: varchar('id', { length: 36 }).primaryKey(),

  // Office hours
  startTime: varchar('start_time', { length: 10 }).default('09:00').notNull(),
  endTime: varchar('end_time', { length: 10 }).default('18:00').notNull(),

  // Break time
  breakStart: varchar('break_start', { length: 10 }).default('13:00').notNull(),
  breakEnd: varchar('break_end', { length: 10 }).default('14:00').notNull(),

  // Late arrival policy
  lateThreshold: integer('late_threshold').default(15).notNull(),
  halfDayThreshold: integer('half_day_threshold').default(240).notNull(),

  // Weekly holidays — JSON array of day names
  weeklyHolidays: jsonb('weekly_holidays')
    .default(['Saturday', 'Sunday'])
    .notNull()
    .$type<string[]>(),

  // Late Rules (Table 10)
  lateRules: jsonb('late_rules')
    .default([
      { minMinutes: 1, maxMinutes: 30, penalty: '30 Minutes Basic Salary Deduction' },
      { minMinutes: 31, maxMinutes: 60, penalty: '1 Hour Basic Salary Deduction' },
      { minMinutes: 61, maxMinutes: 120, penalty: '2 Hours Basic Salary Deduction' },
      { minMinutes: 121, maxMinutes: 240, penalty: 'Half-Day Leave Deduction or Equivalent Basic Salary Deduction' }
    ])
    .notNull()
    .$type<Array<{ minMinutes: number; maxMinutes: number; penalty: string }>>(),

  // Two-step leave approval threshold days
  twoStepLeaveThresholdDays: integer('two_step_leave_threshold_days').default(2).notNull(),

  // Two-step claim approval threshold amount
  twoStepClaimThresholdAmount: numeric('two_step_claim_threshold_amount', { precision: 12, scale: 2 }).default('1000.00').notNull(),

  // Late and Early Out Policies
  earlyOutThreshold: integer('early_out_threshold').default(15).notNull(),
  maxLateAllowedPerMonth: integer('max_late_allowed_per_month').default(3).notNull(),
  lateToDayDeductionRate: integer('late_to_day_deduction_rate').default(3).notNull(),
  maxEarlyOutAllowedPerMonth: integer('max_early_out_allowed_per_month').default(3).notNull(),
  earlyOutToDayDeductionRate: integer('early_out_to_day_deduction_rate').default(3).notNull(),
  enableLateDeduction: boolean('enable_late_deduction').default(true).notNull(),
  enableEarlyOutDeduction: boolean('enable_early_out_deduction').default(true).notNull(),
});

// ─── Holidays ──────────────────────────────────────────────────────────────

export const holidays = pgTable(
  'holidays',
  {
    ...baseTable,

    name: varchar('name', { length: 255 }).notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
  },
  (table) => [
    index('holidays_start_date_idx').on(table.startDate),
    index('holidays_end_date_idx').on(table.endDate),
  ],
);

// ─── Attendance Logs ───────────────────────────────────────────────────────

export const attendanceLogs = pgTable(
  'attendance_logs',
  {
    ...baseTable,

    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    date: date('date').notNull(), // format YYYY-MM-DD
    status: varchar('status', { length: 20 }).default('absent').notNull(), // 'present', 'late', 'absent', 'leave', 'holiday', 'weekend'
    checkIn: varchar('check_in', { length: 15 }), // e.g. "09:05 AM"
    checkOut: varchar('check_out', { length: 15 }), // e.g. "06:00 PM"
    hours: doublePrecision('hours'),
    breakHours: doublePrecision('break_hours').default(0).notNull(),
    location: varchar('location', { length: 20 }), // "Office" or "Remote"
    ipAddress: varchar('ip_address', { length: 45 }),
    device: varchar('device', { length: 255 }),
    notes: varchar('notes', { length: 255 }),

    // Correction Request fields
    correctionStatus: varchar('correction_status', { length: 20 }).default('none').notNull(), // 'none' | 'pending' | 'approved' | 'rejected'
    proposedCheckIn: varchar('proposed_check_in', { length: 15 }),
    proposedCheckOut: varchar('proposed_check_out', { length: 15 }),
    correctionReason: varchar('correction_reason', { length: 255 }),
  },
  (table) => [
    uniqueIndex('attendance_logs_employee_date_idx').on(table.employeeId, table.date),
    index('attendance_logs_date_idx').on(table.date),
    index('attendance_logs_status_idx').on(table.status),
    index('attendance_logs_correction_status_idx').on(table.correctionStatus),
  ],
);

export const attendanceLogsRelations = relations(attendanceLogs, ({ one }) => ({
  employee: one(employees, {
    fields: [attendanceLogs.employeeId],
    references: [employees.id],
  }),
}));
