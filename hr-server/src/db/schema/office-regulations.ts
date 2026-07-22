import {
  pgTable,
  varchar,
  text,
  boolean,
  jsonb,
  uuid,
  timestamp,
  date,
  index,
} from 'drizzle-orm/pg-core';
import { baseTable } from './_base';
import { employees } from './employee';

export const regulationPolicies = pgTable(
  'regulation_policies',
  {
    ...baseTable,
    title: varchar('title', { length: 255 }).notNull(),
    category: varchar('category', { length: 100 }).notNull(), // e.g., "Work From Home", "Equipment", "Dress Code", "General"
    description: text('description').default('').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    requiresApproval: boolean('requires_approval').default(true).notNull(),
    allowEmployeeRequests: boolean('allow_employee_requests').default(true).notNull(),
    metadata: jsonb('metadata').$type<Record<string, any>>(),
    createdById: uuid('created_by_id').notNull().references(() => employees.id, { onDelete: 'restrict' }),
    updatedById: uuid('updated_by_id').notNull().references(() => employees.id, { onDelete: 'restrict' }),
  },
  (table) => [
    index('regulation_policies_category_idx').on(table.category),
    index('regulation_policies_is_active_idx').on(table.isActive),
  ]
);

export const regulationRequests = pgTable(
  'regulation_requests',
  {
    ...baseTable,
    policyId: uuid('policy_id')
      .notNull()
      .references(() => regulationPolicies.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    reason: text('reason').default('').notNull(),
    status: varchar('status', { length: 20 }).default('Pending').notNull(), // 'Pending', 'Pending_2nd', 'Approved', 'Rejected', 'Cancelled'
    requestDate: date('request_date').defaultNow().notNull(),
    effectiveFrom: date('effective_from'),
    effectiveTo: date('effective_to'),
    metadata: jsonb('metadata').$type<Record<string, any>>(),
    
    firstApprovedById: uuid('first_approved_by_id').references(() => employees.id, { onDelete: 'set null' }),
    firstApprovedAt: timestamp('first_approved_at', { withTimezone: true }),
    finalApprovedById: uuid('final_approved_by_id').references(() => employees.id, { onDelete: 'set null' }),
    finalApprovedAt: timestamp('final_approved_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),

    createdById: uuid('created_by_id').references(() => employees.id, { onDelete: 'set null' }),
    updatedById: uuid('updated_by_id').references(() => employees.id, { onDelete: 'set null' }),
  },
  (table) => [
    index('regulation_requests_employee_idx').on(table.employeeId),
    index('regulation_requests_policy_idx').on(table.policyId),
    index('regulation_requests_status_idx').on(table.status),
  ]
);
