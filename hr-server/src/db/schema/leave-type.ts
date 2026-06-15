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
    requiresApproval: boolean('requires_approval').default(true).notNull(),
    requiresDocument: boolean('requires_document').default(false).notNull(),
    description: text('description').default(''),

    /** Policy reference clause e.g. "5.4.3" */
    clause: varchar('clause', { length: 50 }),

    /** Carry-forward policy */
    carryForward: boolean('carry_forward').default(false).notNull(),
    maxCarryOverDays: integer('max_carry_over_days'),

    /** Encashment policy */
    encashment: boolean('encashment').default(false).notNull(),
    encashmentPercent: integer('encashment_percent'),

    /** Pro-rata calculation for new joiners */
    isProRata: boolean('is_pro_rata').default(false).notNull(),

    /** Sandwich leave rule (intervening holidays count as leave) */
    sandwichRule: boolean('sandwich_rule').default(false).notNull(),

    /** Compensatory leave expiry window in days (null = no expiry) */
    compLeaveExpiryDays: integer('comp_leave_expiry_days'),

    /** Eligibility restriction (e.g. "Female Employees Only") */
    eligibility: text('eligibility'),

    /** Soft delete / active flag */
    isActive: boolean('is_active').default(true).notNull(),
  },
  (table) => [
    uniqueIndex('leave_types_name_idx').on(table.name),
    index('leave_types_is_active_idx').on(table.isActive),
  ],
);
