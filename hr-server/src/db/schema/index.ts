import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';

/**
 * Base table with common audit fields.
 * Extend this for all domain tables.
 */
export const baseTable = {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};

// ─────────────────────────────────────────────────────────────
// Domain tables go here. Example:
//
// export const users = pgTable('users', {
//   ...baseTable,
//   email: varchar('email', { length: 255 }).notNull().unique(),
//   name: varchar('name', { length: 255 }).notNull(),
// });
// ─────────────────────────────────────────────────────────────
