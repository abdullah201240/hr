import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { employees } from './employee';

/**
 * audit_logs — enterprise compliance trail for all state-changing API operations.
 *
 * Records: who did what, to which resource, from where, when, and how long it took.
 * Only POST/PUT/PATCH/DELETE operations are captured (GET requests are excluded).
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** Employee who performed the action (null for unauthenticated requests) */
    userId: uuid('user_id').references(() => employees.id, { onDelete: 'set null' }),

    /** Role of the user at the time of the action */
    userRole: varchar('user_role', { length: 20 }),

    /** HTTP method + route template e.g. "POST /employees" */
    action: varchar('action', { length: 500 }).notNull(),

    /** Resource category derived from the URL segment e.g. "employees", "payroll" */
    resourceType: varchar('resource_type', { length: 100 }),

    /** ID of the specific resource affected (from :id route param) */
    resourceId: varchar('resource_id', { length: 100 }),

    /** IPv4 or IPv6 address of the client */
    ipAddress: varchar('ip_address', { length: 45 }),

    /** Full User-Agent string from request headers */
    userAgent: text('user_agent'),

    /** HTTP response status code */
    statusCode: integer('status_code'),

    /** Request processing time in milliseconds */
    duration: integer('duration'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Fast lookup by user + date for audit dashboards
    index('audit_logs_user_id_created_at_idx').on(table.userId, table.createdAt),
    // Fast lookup by resource type + ID for entity-level history
    index('audit_logs_resource_type_id_idx').on(table.resourceType, table.resourceId),
    // Fast lookup by created_at for time-range queries
    index('audit_logs_created_at_idx').on(table.createdAt),
  ],
);
