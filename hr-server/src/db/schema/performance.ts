import { pgTable, varchar, text, integer, uuid } from 'drizzle-orm/pg-core';
import { baseTable } from './_base';
import { employees } from './employee';

export const employeeKpis = pgTable('employee_kpis', {
  ...baseTable,
  employeeId: uuid('employee_id')
    .references(() => employees.id, { onDelete: 'cascade' })
    .notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  targetMetric: varchar('target_metric', { length: 255 }).notNull(),
  weight: integer('weight').notNull(),
  score: integer('score'),
});
