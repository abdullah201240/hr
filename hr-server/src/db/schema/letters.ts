import {
  pgTable,
  varchar,
  text,
  date,
  uuid,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseTable } from './_base';
import { employees } from './employee';

export const issuedLetters = pgTable(
  'issued_letters',
  {
    ...baseTable,
    type: varchar('type', { length: 50 }).notNull(), // 'offer' | 'appointment' | 'confirmation' | etc.
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    subject: varchar('subject', { length: 255 }).notNull(),
    issueDate: date('issue_date').notNull(),
    effectiveDate: date('effective_date').notNull(),
    status: varchar('status', { length: 20 }).default('Draft').notNull(), // 'Draft' | 'Sent' | 'Signed' | 'Archived'
    body: text('body').notNull(),
    fields: jsonb('fields').$type<Record<string, string>>().default({}).notNull(),
    createdBy: varchar('created_by', { length: 255 }).default('HR Admin').notNull(),
  },
  (table) => [
    index('issued_letters_employee_idx').on(table.employeeId),
    index('issued_letters_type_idx').on(table.type),
    index('issued_letters_status_idx').on(table.status),
  ],
);

// Relations
export const issuedLettersRelations = relations(issuedLetters, ({ one }) => ({
  employee: one(employees, {
    fields: [issuedLetters.employeeId],
    references: [employees.id],
  }),
}));
