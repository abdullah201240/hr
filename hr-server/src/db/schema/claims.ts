import {
  pgTable,
  varchar,
  text,
  integer,
  numeric,
  date,
  uuid,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseTable } from './_base';
import { employees } from './employee';

/**
 * Claims table — unified table for all three claim types:
 *   - medical_reimbursement (Medical Reimbursement)
 *   - tada (TA/DA Travel Claims)
 *   - travel_advance (Business Travel Advance)
 *
 * Type-specific fields are stored in `details` jsonb column.
 */
export const claims = pgTable(
  'claims',
  {
    ...baseTable,

    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),

    /** Claim category */
    claimType: varchar('claim_type', { length: 30 }).notNull(), // 'medical_reimbursement' | 'tada' | 'travel_advance'

    /** Common fields */
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    status: varchar('status', { length: 20 }).default('Pending').notNull(), // 'Pending' | 'Pending_2nd' | 'Approved' | 'Rejected' | 'Settled'
    description: text('description').default('').notNull(),

    /** Travel advance: approved amount (may differ from requested) */
    approvedAmount: numeric('approved_amount', { precision: 12, scale: 2 }),

    /** Type-specific details stored as JSON:
     *  medical: { type: 'Health Checkup', serviceDate: '2026-06-10' }
     *  tada: { travelType: 'Domestic Flight', from: 'Dhaka', to: 'Chittagong', startDate, endDate, purpose }
     *  travel_advance: { destination: 'Boston, MA', purpose: 'Client Meeting', startDate, endDate, justification }
     */
    details: jsonb('details').$type<Record<string, any>>(),

    /** Approval tracking */
    firstApprovedById: uuid('first_approved_by_id').references(() => employees.id, { onDelete: 'set null' }),
    firstApprovedAt: timestamp('first_approved_at', { withTimezone: true }),
    approvedById: uuid('approved_by_id').references(() => employees.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    rejectedAt: timestamp('rejected_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),
    settledAt: timestamp('settled_at', { withTimezone: true }),
  },
  (table) => [
    index('claims_employee_idx').on(table.employeeId),
    index('claims_claim_type_idx').on(table.claimType),
    index('claims_status_idx').on(table.status),
    index('claims_created_at_idx').on(table.createdAt),
  ],
);

export const claimsRelations = relations(claims, ({ one, many }) => ({
  employee: one(employees, {
    fields: [claims.employeeId],
    references: [employees.id],
    relationName: 'employeeClaims',
  }),
  firstApprovedBy: one(employees, {
    fields: [claims.firstApprovedById],
    references: [employees.id],
    relationName: 'firstApprovedClaims',
  }),
  approvedBy: one(employees, {
    fields: [claims.approvedById],
    references: [employees.id],
    relationName: 'approvedClaims',
  }),
  attachments: many(claimAttachments),
}));

export const claimAttachments = pgTable('claim_attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  claimId: uuid('claim_id')
    .notNull()
    .references(() => claims.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const claimAttachmentsRelations = relations(claimAttachments, ({ one }) => ({
  claim: one(claims, {
    fields: [claimAttachments.claimId],
    references: [claims.id],
  }),
}));
