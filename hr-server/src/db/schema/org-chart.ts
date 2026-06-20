import { pgTable, varchar, integer, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { baseTable } from './_base';

export const orgChartNodes = pgTable('org_chart_nodes', {
  ...baseTable,
  id: varchar('id', { length: 255 }).primaryKey(),
  parentId: varchar('parent_id', { length: 255 }).references((): AnyPgColumn => orgChartNodes.id, { onDelete: 'cascade' }),
  personName: varchar('person_name', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  department: varchar('department', { length: 255 }).notNull(),
  grade: varchar('grade', { length: 50 }).notNull(),
  headcount: integer('headcount').default(1).notNull(),
  openRoles: integer('open_roles').default(0).notNull(),
  avatarColor: varchar('avatar_color', { length: 255 }).notNull(),
});
