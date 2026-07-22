import {
  pgTable,
  varchar,
  doublePrecision,
  uuid,
  timestamp,
  text,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseTable } from './_base';
import { employees } from './employee';

export const assets = pgTable('assets', {
  ...baseTable,
  assetTag: varchar('asset_tag', { length: 100 }).unique().notNull(), // e.g. AST-001
  name: varchar('name', { length: 255 }).notNull(), // e.g. MacBook Pro M3
  serialNumber: varchar('serial_number', { length: 255 }).unique().notNull(), // manufacturer serial
  category: varchar('category', { length: 100 }).notNull(), // Laptop, Mobile, Monitor, Access Card, Others
  model: varchar('model', { length: 255 }),
  purchaseDate: date('purchase_date'),
  cost: doublePrecision('cost').default(0).notNull(),
  condition: varchar('condition', { length: 50 }).default('New').notNull(), // New | Good | Damaged | Lost
  status: varchar('status', { length: 50 }).default('Available').notNull(), // Available | Assigned | Under Maintenance | Retired
  assignedToId: uuid('assigned_to_id').references(() => employees.id, { onDelete: 'set null' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  returnDueDate: timestamp('return_due_date', { withTimezone: true }),
  remarks: text('remarks'),
});

export const assetHistory = pgTable('asset_history', {
  ...baseTable,
  assetId: uuid('asset_id')
    .notNull()
    .references(() => assets.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 50 }).notNull(), // Allocation | Return | Condition Update | Status Update
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'set null' }),
  actionById: uuid('action_by_id').references(() => employees.id, { onDelete: 'set null' }),
  notes: text('notes'),
});

// Relations
export const assetsRelations = relations(assets, ({ one, many }) => ({
  assignedTo: one(employees, {
    fields: [assets.assignedToId],
    references: [employees.id],
  }),
  history: many(assetHistory),
}));

export const assetHistoryRelations = relations(assetHistory, ({ one }) => ({
  asset: one(assets, {
    fields: [assetHistory.assetId],
    references: [assets.id],
  }),
  employee: one(employees, {
    fields: [assetHistory.employeeId],
    references: [employees.id],
  }),
  actionBy: one(employees, {
    fields: [assetHistory.actionById],
    references: [employees.id],
  }),
}));
