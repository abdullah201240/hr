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
});

// ─── Holidays ──────────────────────────────────────────────────────────────

export const holidays = pgTable('holidays', {
  ...baseTable,

  name: varchar('name', { length: 255 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
});

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
  ],
);

export const attendanceLogsRelations = relations(attendanceLogs, ({ one }) => ({
  employee: one(employees, {
    fields: [attendanceLogs.employeeId],
    references: [employees.id],
  }),
}));
