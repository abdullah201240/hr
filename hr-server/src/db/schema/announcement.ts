import {
  pgTable,
  varchar,
  text,
  date,
  uuid,
  index,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseTable } from './_base';
import { employees } from './employee';

export const announcements = pgTable(
  'announcements',
  {
    ...baseTable,
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content').notNull(),
    category: varchar('category', { length: 50 }).default('info').notNull(), // info, warning, event, policy
    department: varchar('department', { length: 255 }).default('All Departments').notNull(),
    date: date('date').notNull(),
    authorId: uuid('author_id')
      .references((): AnyPgColumn => employees.id, { onDelete: 'set null' }),
    authorName: varchar('author_name', { length: 255 }).default('HR Admin').notNull(),
    status: varchar('status', { length: 20 }).default('Published').notNull(), // Published | Draft
  },
  (table) => [
    index('announcements_date_idx').on(table.date),
    index('announcements_status_idx').on(table.status),
    index('announcements_category_idx').on(table.category),
  ],
);

export const announcementsRelations = relations(announcements, ({ one }) => ({
  author: one(employees, {
    fields: [announcements.authorId],
    references: [employees.id],
  }),
}));
