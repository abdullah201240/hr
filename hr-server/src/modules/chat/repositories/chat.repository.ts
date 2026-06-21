import { Injectable, Inject } from '@nestjs/common';
import { eq, and, or, sql, desc, lt, count } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../../db';
import { chatRooms, chatRoomMembers, chatMessages, employees } from '../../../db/schema';

@Injectable()
export class ChatRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: Database) {}

  /**
   * Find a room by ID
   */
  async findRoomById(roomId: string) {
    const [room] = await this.db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.id, roomId))
      .limit(1);
    return room;
  }

  /**
   * Check if a 1-to-1 direct message room already exists between two employees
   */
  async findDirectMessageRoom(employeeId1: string, employeeId2: string) {
    const subquery = this.db
      .select({ roomId: chatRoomMembers.roomId })
      .from(chatRoomMembers)
      .innerJoin(chatRooms, eq(chatRooms.id, chatRoomMembers.roomId))
      .where(
        and(
          eq(chatRooms.type, 'direct'),
          or(
            eq(chatRoomMembers.employeeId, employeeId1),
            eq(chatRoomMembers.employeeId, employeeId2)
          )
        )
      )
      .groupBy(chatRoomMembers.roomId)
      .having(sql`count(${chatRoomMembers.employeeId}) = 2`)
      .as('sq');

    const [existingRoom] = await this.db
      .select({
        id: chatRooms.id,
        name: chatRooms.name,
        type: chatRooms.type,
        createdAt: chatRooms.createdAt,
      })
      .from(chatRooms)
      .innerJoin(subquery, eq(chatRooms.id, subquery.roomId))
      .limit(1);

    return existingRoom || null;
  }

  /**
   * Create a 1-to-1 direct message room
   */
  async createDirectMessageRoom(creatorId: string, recipientId: string) {
    return this.db.transaction(async (tx) => {
      const [room] = await tx
        .insert(chatRooms)
        .values({
          type: 'direct',
          name: null,
          isPrivate: true,
          createdById: creatorId,
        })
        .returning();

      await tx.insert(chatRoomMembers).values([
        { roomId: room.id, employeeId: creatorId, role: 'member' },
        { roomId: room.id, employeeId: recipientId, role: 'member' },
      ]);

      return room;
    });
  }

  /**
   * Create a group channel
   */
  async createChannelRoom(creatorId: string, name: string, description: string, isPrivate: boolean) {
    return this.db.transaction(async (tx) => {
      const [room] = await tx
        .insert(chatRooms)
        .values({
          type: 'channel',
          name,
          description,
          isPrivate,
          createdById: creatorId,
        })
        .returning();

      await tx.insert(chatRoomMembers).values({
        roomId: room.id,
        employeeId: creatorId,
        role: 'owner',
      });

      return room;
    });
  }

  /**
   * Add a member to a room
   */
  async addMember(roomId: string, employeeId: string, role: 'admin' | 'member' = 'member') {
    const [existing] = await this.db
      .select()
      .from(chatRoomMembers)
      .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.employeeId, employeeId)))
      .limit(1);

    if (existing) return existing;

    const [member] = await this.db
      .insert(chatRoomMembers)
      .values({ roomId, employeeId, role })
      .returning();

    return member;
  }

  /**
   * Remove a member from a room
   */
  async removeMember(roomId: string, employeeId: string) {
    await this.db
      .delete(chatRoomMembers)
      .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.employeeId, employeeId)));
  }

  /**
   * Check if user is a member of a room
   */
  async isMember(roomId: string, employeeId: string): Promise<boolean> {
    const [member] = await this.db
      .select({ roomId: chatRoomMembers.roomId })
      .from(chatRoomMembers)
      .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.employeeId, employeeId)))
      .limit(1);

    return !!member;
  }

  /**
   * Get all members of a room
   */
  async getRoomMembers(roomId: string) {
    return this.db
      .select({
        id: employees.id,
        fullNameEnglish: employees.fullNameEnglish,
        email: employees.email,
        employeePhotoUrl: employees.employeePhotoUrl,
        role: chatRoomMembers.role,
        lastReadAt: chatRoomMembers.lastReadAt,
      })
      .from(chatRoomMembers)
      .innerJoin(employees, eq(employees.id, chatRoomMembers.employeeId))
      .where(eq(chatRoomMembers.roomId, roomId));
  }

  /**
   * Save a chat message
   */
  async saveMessage(roomId: string, senderId: string, content: string) {
    const [message] = await this.db
      .insert(chatMessages)
      .values({
        roomId,
        senderId,
        content,
      })
      .returning();

    return message;
  }

  /**
   * Edit an existing message (authenticates sender)
   */
  async editMessage(messageId: string, senderId: string, content: string) {
    const [message] = await this.db
      .update(chatMessages)
      .set({
        content,
        isEdited: true,
        updatedAt: new Date(),
      })
      .where(and(eq(chatMessages.id, messageId), eq(chatMessages.senderId, senderId)))
      .returning();

    return message || null;
  }

  /**
   * Soft-delete a message (authenticates sender)
   */
  async deleteMessage(messageId: string, senderId: string) {
    const [message] = await this.db
      .update(chatMessages)
      .set({
        isDeleted: true,
        content: 'This message was deleted.',
        updatedAt: new Date(),
      })
      .where(and(eq(chatMessages.id, messageId), eq(chatMessages.senderId, senderId)))
      .returning();

    return message || null;
  }

  /**
   * Get paginated messages for a room (cursor-based pagination)
   */
  async getRoomMessages(roomId: string, limit: number, cursor?: string) {
    const conditions = [eq(chatMessages.roomId, roomId)];

    if (cursor) {
      const [cursorMsg] = await this.db
        .select({ createdAt: chatMessages.createdAt })
        .from(chatMessages)
        .where(eq(chatMessages.id, cursor))
        .limit(1);

      if (cursorMsg) {
        conditions.push(lt(chatMessages.createdAt, cursorMsg.createdAt));
      }
    }

    const messages = await this.db
      .select({
        id: chatMessages.id,
        roomId: chatMessages.roomId,
        senderId: chatMessages.senderId,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
        updatedAt: chatMessages.updatedAt,
        isEdited: chatMessages.isEdited,
        isDeleted: chatMessages.isDeleted,
        senderName: employees.fullNameEnglish,
        senderPhotoUrl: employees.employeePhotoUrl,
      })
      .from(chatMessages)
      .innerJoin(employees, eq(employees.id, chatMessages.senderId))
      .where(and(...conditions))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);

    return messages.reverse();
  }

  /**
   * Update member last read timestamp
   */
  async updateLastRead(roomId: string, employeeId: string) {
    await this.db
      .update(chatRoomMembers)
      .set({ lastReadAt: new Date() })
      .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.employeeId, employeeId)));
  }

  /**
   * Find all rooms/conversations that a user belongs to, optimized to prevent N+1 queries.
   */
  async findRoomsForEmployee(employeeId: string) {
    // 1. Get all room IDs the employee belongs to
    const memberRooms = await this.db
      .select({
        roomId: chatRoomMembers.roomId,
      })
      .from(chatRoomMembers)
      .where(eq(chatRoomMembers.employeeId, employeeId));

    if (memberRooms.length === 0) return [];
    const roomIds = memberRooms.map((r) => r.roomId);

    // 2. Fetch Room Details combined with Unread Message Counts (Query #1)
    const roomsList = await this.db
      .select({
        id: chatRooms.id,
        name: chatRooms.name,
        type: chatRooms.type,
        description: chatRooms.description,
        isPrivate: chatRooms.isPrivate,
        createdAt: chatRooms.createdAt,
        lastReadAt: chatRoomMembers.lastReadAt,
        unreadCount: sql<number>`COALESCE(count(${chatMessages.id}) FILTER (WHERE ${chatMessages.createdAt} > ${chatRoomMembers.lastReadAt}), 0)::integer`,
      })
      .from(chatRooms)
      .innerJoin(chatRoomMembers, and(eq(chatRoomMembers.roomId, chatRooms.id), eq(chatRoomMembers.employeeId, employeeId)))
      .leftJoin(chatMessages, eq(chatMessages.roomId, chatRooms.id))
      .where(sql`${chatRooms.id} IN ${roomIds}`)
      .groupBy(chatRooms.id, chatRoomMembers.lastReadAt);

    // 3. Fetch Last Messages for each room in bulk using DISTINCT ON (Query #2)
    const lastMessages = await this.db.execute(sql`
      SELECT DISTINCT ON (room_id) 
        room_id as "roomId", 
        m.id, 
        m.content, 
        m.created_at as "createdAt", 
        e.full_name_english as "senderName"
      FROM chat_messages m
      JOIN employees e ON e.id = m.sender_id
      WHERE room_id IN (${sql.join(roomIds.map(id => sql`${id}`), sql`, `)})
      ORDER BY room_id, created_at DESC
    `);

    // Cast the execute rows into a mapping
    const lastMessageMap: Record<string, any> = {};
    if (Array.isArray(lastMessages)) {
      lastMessages.forEach((row: any) => {
        lastMessageMap[row.roomId] = {
          id: row.id,
          content: row.content,
          createdAt: row.createdAt,
          senderName: row.senderName,
        };
      });
    }

    // 4. Fetch All Members for all retrieved rooms in a single query (Query #3)
    const allMembers = await this.db
      .select({
        roomId: chatRoomMembers.roomId,
        id: employees.id,
        fullNameEnglish: employees.fullNameEnglish,
        email: employees.email,
        employeePhotoUrl: employees.employeePhotoUrl,
        role: chatRoomMembers.role,
        lastReadAt: chatRoomMembers.lastReadAt,
      })
      .from(chatRoomMembers)
      .innerJoin(employees, eq(employees.id, chatRoomMembers.employeeId))
      .where(sql`${chatRoomMembers.roomId} IN ${roomIds}`);

    // Group members by roomId
    const membersMap: Record<string, any[]> = {};
    allMembers.forEach((m) => {
      const { roomId, ...memberData } = m;
      if (!membersMap[roomId]) {
        membersMap[roomId] = [];
      }
      membersMap[roomId].push({
        ...memberData,
        presence: 'offline', // Default, resolved in Service layer via Redis pipelines
      });
    });

    // 5. Construct the final aggregated rooms list
    const roomData = roomsList.map((room) => {
      const roomId = room.id;
      const members = membersMap[roomId] || [];
      const otherMembers = members.filter((m) => m.id !== employeeId);

      // For DMs, resolve the dynamic display name and avatar
      let displayName = room.name;
      let displayPhotoUrl = null;

      if (room.type === 'direct') {
        const otherUser = otherMembers[0] || members[0];
        displayName = otherUser ? otherUser.fullNameEnglish : 'Unknown User';
        displayPhotoUrl = otherUser ? otherUser.employeePhotoUrl : null;
      }

      return {
        id: room.id,
        name: room.name,
        type: room.type as 'direct' | 'channel',
        description: room.description,
        isPrivate: room.isPrivate,
        createdAt: room.createdAt,
        displayName: displayName || 'Unnamed Conversation',
        displayPhotoUrl,
        unreadCount: room.unreadCount,
        lastMessage: lastMessageMap[roomId] || null,
        members,
      };
    });

    // Sort rooms by last message date, or creation date if no messages
    return roomData.sort((a, b) => {
      const dateA = a.lastMessage?.createdAt || a.createdAt;
      const dateB = b.lastMessage?.createdAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }

  /**
   * Search messages in user's rooms (fully escaped to prevent information disclosure)
   */
  async searchMessages(employeeId: string, query: string, limit = 50) {
    const memberRooms = await this.db
      .select({ roomId: chatRoomMembers.roomId })
      .from(chatRoomMembers)
      .where(eq(chatRoomMembers.employeeId, employeeId));

    if (memberRooms.length === 0) return [];
    const roomIds = memberRooms.map(r => r.roomId);

    // Escape SQL wildcard symbols to prevent unintended full-table disclosures
    const escapedQuery = query.replace(/[%_\\]/g, '\\$&');

    return this.db
      .select({
        id: chatMessages.id,
        roomId: chatMessages.roomId,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
        isEdited: chatMessages.isEdited,
        isDeleted: chatMessages.isDeleted,
        senderName: employees.fullNameEnglish,
        senderPhotoUrl: employees.employeePhotoUrl,
        roomName: chatRooms.name,
        roomType: chatRooms.type,
      })
      .from(chatMessages)
      .innerJoin(employees, eq(employees.id, chatMessages.senderId))
      .innerJoin(chatRooms, eq(chatRooms.id, chatMessages.roomId))
      .where(
        and(
          sql`${chatMessages.roomId} IN ${roomIds}`,
          sql`${chatMessages.content} ILIKE ${'%' + escapedQuery + '%'} ESCAPE '\\'`
        )
      )
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }
}
