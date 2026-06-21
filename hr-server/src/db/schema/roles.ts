import { pgTable, uuid, varchar, text, boolean, unique } from 'drizzle-orm/pg-core';
import { baseTable } from './_base';

export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  resource: varchar('resource', { length: 100 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  description: text('description'),
}, (t) => [
  unique('unique_resource_action').on(t.resource, t.action)
]);

export const customRoles = pgTable('custom_roles', {
  ...baseTable,
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  isSystem: boolean('is_system').default(false).notNull(),
});

export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  roleKey: varchar('role_key', { length: 100 }).notNull(),
  permissionId: uuid('permission_id').references(() => permissions.id, { onDelete: 'cascade' }).notNull(),
}, (t) => [
  unique('unique_role_permission').on(t.roleKey, t.permissionId)
]);
