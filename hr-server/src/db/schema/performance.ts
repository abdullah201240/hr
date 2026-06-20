import { pgTable, varchar, text, integer, uuid, date, boolean, timestamp } from 'drizzle-orm/pg-core';
import { baseTable } from './_base';
import { employees, designations } from './employee';

export const appraisalCycles = pgTable('appraisal_cycles', {
  ...baseTable,
  name: varchar('name', { length: 255 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: varchar('status', { length: 50 }).default('draft').notNull(), // draft | active | completed
  description: text('description'),
});

export const employeeAppraisals = pgTable('employee_appraisals', {
  ...baseTable,
  employeeId: uuid('employee_id')
    .references(() => employees.id, { onDelete: 'cascade' })
    .notNull(),
  cycleId: uuid('cycle_id')
    .references(() => appraisalCycles.id, { onDelete: 'cascade' })
    .notNull(),
  status: varchar('status', { length: 50 }).default('pending_self').notNull(), // pending_self | pending_manager | completed
  selfScore: integer('self_score'),
  managerScore: integer('manager_score'),
  finalScore: integer('final_score'),
  selfFeedback: text('self_feedback'),
  managerFeedback: text('manager_feedback'),
  promotionRecommended: boolean('promotion_recommended').default(false).notNull(),
  promotionReadiness: varchar('promotion_readiness', { length: 50 }).default('not_eligible').notNull(), // ready_now | ready_1_2_years | not_eligible
  recommendedDesignationId: uuid('recommended_designation_id')
    .references(() => designations.id, { onDelete: 'set null' }),
  managerNotes: text('manager_notes'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const employeeKpis = pgTable('employee_kpis', {
  ...baseTable,
  employeeId: uuid('employee_id')
    .references(() => employees.id, { onDelete: 'cascade' })
    .notNull(),
  cycleId: uuid('cycle_id')
    .references(() => appraisalCycles.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  targetMetric: varchar('target_metric', { length: 255 }).notNull(),
  weight: integer('weight').notNull(),
  score: integer('score'), // manager's finalized score
  selfScore: integer('self_score'),
  managerScore: integer('manager_score'),
  comments: text('comments'),
});
