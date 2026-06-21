import { pgTable, uuid, text, varchar, timestamp, index, primaryKey, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseTable } from './_base';
import { employees } from './employee';

// ─── Chat Rooms (DM or Channels) ─────────────────────────────────────────────
export const chatRooms = pgTable(
  'chat_rooms',
  {
    ...baseTable,
    name: varchar('name', { length: 255 }), // Null for 1-to-1 DMs
    type: varchar('type', { length: 20 }).notNull(), // 'direct' | 'channel'
    description: text('description').default(''),
    isPrivate: boolean('is_private').default(false).notNull(),
    createdById: uuid('created_by_id').references(() => employees.id, { onDelete: 'set null' }),
  },
  (table) => [
    index('chat_rooms_type_idx').on(table.type),
    index('chat_rooms_created_at_idx').on(table.createdAt),
  ]
);

// ─── Chat Room Members ────────────────────────────────────────────────────────
export const chatRoomMembers = pgTable(
  'chat_room_members',
  {
    roomId: uuid('room_id')
      .notNull()
      .references(() => chatRooms.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 20 }).default('member').notNull(), // 'owner' | 'admin' | 'member'
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    lastReadAt: timestamp('last_read_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.roomId, table.employeeId] }),
    index('chat_room_members_employee_idx').on(table.employeeId),
  ]
);

// ─── Chat Messages ───────────────────────────────────────────────────────────
export const chatMessages = pgTable(
  'chat_messages',
  {
    ...baseTable,
    roomId: uuid('room_id')
      .notNull()
      .references(() => chatRooms.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    content: text('content').notNull(), // Strict Text-only validation
    isEdited: boolean('is_edited').default(false).notNull(),
    isDeleted: boolean('is_deleted').default(false).notNull(),
  },
  (table) => [
    index('chat_messages_room_created_idx').on(table.roomId, table.createdAt),
    index('chat_messages_sender_idx').on(table.senderId),
  ]
);


// ─── Relations ──────────────────────────────────────────────────────────────
export const chatRoomsRelations = relations(chatRooms, ({ many, one }) => ({
  members: many(chatRoomMembers),
  messages: many(chatMessages),
  createdBy: one(employees, {
    fields: [chatRooms.createdById],
    references: [employees.id],
  }),
}));

export const chatRoomMembersRelations = relations(chatRoomMembers, ({ one }) => ({
  room: one(chatRooms, {
    fields: [chatRoomMembers.roomId],
    references: [chatRooms.id],
  }),
  employee: one(employees, {
    fields: [chatRoomMembers.employeeId],
    references: [employees.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  room: one(chatRooms, {
    fields: [chatMessages.roomId],
    references: [chatRooms.id],
  }),
  sender: one(employees, {
    fields: [chatMessages.senderId],
    references: [employees.id],
  }),
}));
