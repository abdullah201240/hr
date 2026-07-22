import {
  pgTable,
  varchar,
  text,
  integer,
  jsonb,
  date,
  uuid,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseTable } from './_base';
import { employees } from './employee';
import { leaveTypes } from './leave-type';

export const leaveApplications = pgTable(
  'leave_applications',
  {
    ...baseTable,

    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    leaveTypeId: uuid('leave_type_id')
      .notNull()
      .references(() => leaveTypes.id, { onDelete: 'restrict' }),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    days: integer('days').notNull(),
    reason: text('reason').default('').notNull(),
    status: varchar('status', { length: 20 }).default('Pending').notNull(), // 'Pending', 'Pending_2nd', 'Approved', 'Rejected'

    firstApprovedById: uuid('first_approved_by_id').references(() => employees.id, { onDelete: 'set null' }),
    firstApprovedAt: timestamp('first_approved_at', { withTimezone: true }),
    approvedById: uuid('approved_by_id').references(() => employees.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    rejectedAt: timestamp('rejected_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),

  },
  (table) => [
    index('leave_applications_employee_idx').on(table.employeeId),
    index('leave_applications_leave_type_idx').on(table.leaveTypeId),
    index('leave_applications_status_idx').on(table.status),
    index('leave_applications_dates_idx').on(table.startDate, table.endDate),
  ],
);

export const leaveApplicationsRelations = relations(
  leaveApplications,
  ({ one, many }) => ({
    employee: one(employees, {
      fields: [leaveApplications.employeeId],
      references: [employees.id],
      relationName: 'employeeApplications',
    }),
    leaveType: one(leaveTypes, {
      fields: [leaveApplications.leaveTypeId],
      references: [leaveTypes.id],
    }),
    firstApprovedBy: one(employees, {
      fields: [leaveApplications.firstApprovedById],
      references: [employees.id],
      relationName: 'firstApprovedApplications',
    }),
    approvedBy: one(employees, {
      fields: [leaveApplications.approvedById],
      references: [employees.id],
      relationName: 'approvedApplications',
    }),
    attachments: many(leaveAttachments),
  }),
);

export const leaveAttachments = pgTable('leave_attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  leaveApplicationId: uuid('leave_application_id')
    .notNull()
    .references(() => leaveApplications.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const leaveAttachmentsRelations = relations(
  leaveAttachments,
  ({ one }) => ({
    leaveApplication: one(leaveApplications, {
      fields: [leaveAttachments.leaveApplicationId],
      references: [leaveApplications.id],
    }),
  }),
);
