import {
  pgTable,
  varchar,
  integer,
  jsonb,
  date,
} from 'drizzle-orm/pg-core';
import { baseTable } from './_base';

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
