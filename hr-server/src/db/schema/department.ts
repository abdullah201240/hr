import {
  pgTable,
  varchar,
  text,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseTable } from './_base';
import { employees } from './employee';

// ─── Departments ────────────────────────────────────────────────────────────

export const departments = pgTable(
  'departments',
  {
    ...baseTable,

    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    description: text('description').default(''),

    /** Optional head of department (reference to an employee) */
    headEmployeeId: varchar('head_employee_id', { length: 255 }),

    /** Soft delete / active flag */
    isActive: boolean('is_active').default(true).notNull(),
  },
  (table) => [
    uniqueIndex('departments_code_idx').on(table.code),
    uniqueIndex('departments_name_idx').on(table.name),
    index('departments_is_active_idx').on(table.isActive),
  ],
);

// ─── Designations ───────────────────────────────────────────────────────────

export const designations = pgTable(
  'designations',
  {
    ...baseTable,

    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    description: text('description').default(''),

    /** Grade/level for hierarchy (e.g. L1, L2, L3 … or "Senior", "Junior") */
    grade: varchar('grade', { length: 50 }).default(''),

    /** Soft delete / active flag */
    isActive: boolean('is_active').default(true).notNull(),
  },
  (table) => [
    uniqueIndex('designations_code_idx').on(table.code),
    uniqueIndex('designations_name_idx').on(table.name),
    index('designations_is_active_idx').on(table.isActive),
  ],
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const departmentsRelations = relations(departments, ({ many }) => ({
  employees: many(employees),
}));

export const designationsRelations = relations(designations, ({ many }) => ({
  employees: many(employees),
}));
