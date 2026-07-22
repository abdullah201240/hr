import { pgTable, varchar, text, boolean, uuid, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { baseTable } from './_base';
import { employees } from './employee';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

export const notifications = pgTable(
  'notifications',
  {
    ...baseTable,
    recipientId: uuid('recipient_id')
      .references((): AnyPgColumn => employees.id, { onDelete: 'cascade' })
      .notNull(),
    actorId: uuid('actor_id').references((): AnyPgColumn => employees.id, { onDelete: 'set null' }),
    module: varchar('module', { length: 50 }).notNull(), // leave, tasks, attendance, claims, payroll, etc.
    category: varchar('category', { length: 50 }).notNull(), // approval, rejection, assignment, mention, status_change, etc.
    priority: varchar('priority', { length: 20 }).default('normal').notNull(), // low, normal, high, urgent
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    entityType: varchar('entity_type', { length: 50 }), // leave_application, task, etc.
    entityId: uuid('entity_id'),
    actionUrl: varchar('action_url', { length: 500 }),
    actions: jsonb('actions').$type<any[]>(), // Action buttons schema
    isRead: boolean('is_read').default(false).notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    isArchived: boolean('is_archived').default(false).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    dedupKey: varchar('dedup_key', { length: 255 }),
    metadata: jsonb('metadata').$type<Record<string, any>>(),
  },
  (table) => [
    index('idx_notifications_recipient_unread').on(table.recipientId, table.isRead, table.createdAt),
    index('idx_notifications_recipient_module').on(table.recipientId, table.module, table.createdAt),
    index('idx_notifications_entity').on(table.entityType, table.entityId),
    uniqueIndex('idx_notifications_dedup').on(table.dedupKey),
    index('idx_notifications_expires').on(table.expiresAt),
  ]
);

export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    ...baseTable,
    employeeId: uuid('employee_id')
      .references((): AnyPgColumn => employees.id, { onDelete: 'cascade' })
      .notNull()
      .unique(),
    disabledModules: jsonb('disabled_modules')
      .default([])
      .notNull()
      .$type<string[]>(),
    disabledCategories: jsonb('disabled_categories')
      .default([])
      .notNull()
      .$type<string[]>(),
    pushEnabled: boolean('push_enabled').default(true).notNull(),
    quietHoursStart: varchar('quiet_hours_start', { length: 5 }), // e.g. "22:00"
    quietHoursEnd: varchar('quiet_hours_end', { length: 5 }), // e.g. "07:00"
    digestFrequency: varchar('digest_frequency', { length: 20 }).default('realtime').notNull(),
  },
  (table) => [
    index('idx_notification_prefs_employee').on(table.employeeId),
  ]
);
