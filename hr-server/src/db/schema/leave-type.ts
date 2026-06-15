import {
  pgTable,
  varchar,
  text,
  boolean,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { baseTable } from './_base';

export const leaveTypes = pgTable(
  'leave_types',
  {
    ...baseTable,

    name: varchar('name', { length: 255 }).notNull(),
    icon: varchar('icon', { length: 50 }).default('CalendarOff').notNull(),
    color: varchar('color', { length: 50 }).default('bg-sky-500').notNull(),
    days: integer('days').notNull(),
    paid: boolean('paid').default(true).notNull(),
    carryForward: boolean('carry_forward').default(false).notNull(),
    maxCarryOver: integer('max_carry_over').default(0).notNull(),
    requiresApproval: boolean('requires_approval').default(true).notNull(),
    requiresDocument: boolean('requires_document').default(false).notNull(),
    description: text('description').default(''),

    /** Soft delete / active flag */
    isActive: boolean('is_active').default(true).notNull(),
  },
  (table) => [
    uniqueIndex('leave_types_name_idx').on(table.name),
    index('leave_types_is_active_idx').on(table.isActive),
  ],
);
