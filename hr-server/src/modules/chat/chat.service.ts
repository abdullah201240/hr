import { Injectable, Inject, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { REDIS_CLIENT } from '../../common/cache/cache.service';
import { ChatRepository } from './repositories/chat.repository';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly chatRepository: ChatRepository,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectQueue('chat-notification') private readonly notificationQueue: Queue
  ) {}

  // ─── Presence System (Redis) ────────────────────────────────────────────────

  /**
   * Set user presence status to online with a TTL of 60 seconds (heartbeat window)
   */
  async setUserOnline(employeeId: string) {
    const key = `presence:${employeeId}`;
    await this.redis.setex(key, 60, 'online');
  }

  /**
   * Clear user presence status (logout/disconnect)
   */
  async setUserOffline(employeeId: string) {
    const key = `presence:${employeeId}`;
    await this.redis.del(key);
  }

  /**
   * Retrieve online/offline presence status for a single user
   */
  async getUserPresence(employeeId: string): Promise<'online' | 'offline'> {
    const status = await this.redis.get(`presence:${employeeId}`);
    return status === 'online' ? 'online' : 'offline';
  }

  /**
   * Get presences of multiple users in a single pipeline query (O(N) batch read)
   */
  async getMultiplePresences(employeeIds: string[]): Promise<Record<string, 'online' | 'offline'>> {
    if (employeeIds.length === 0) return {};
    const pipeline = this.redis.pipeline();
    employeeIds.forEach((id) => pipeline.get(`presence:${id}`));
    const results = await pipeline.exec();

    const presences: Record<string, 'online' | 'offline'> = {};
    if (results) {
      employeeIds.forEach((id, index) => {
        const error = results[index][0];
        const val = results[index][1] as string | null;
        presences[id] = !error && val === 'online' ? 'online' : 'offline';
      });
    } else {
      employeeIds.forEach((id) => {
        presences[id] = 'offline';
      });
    }
    return presences;
  }

  // ─── Room / Message Operations ──────────────────────────────────────────────

  /**
   * Check if employee is a member of a room
   */
  async isMember(roomId: string, employeeId: string): Promise<boolean> {
    return this.chatRepository.isMember(roomId, employeeId);
  }

  /**
   * Retrieve all members of a room
   */
  async getRoomMembers(roomId: string) {
    return this.chatRepository.getRoomMembers(roomId);
  }

  /**
   * Get all conversations a user is in, using Redis caching.
   */
  async getUserRooms(employeeId: string) {
    const cacheKey = `chat:rooms:user:${employeeId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      // Re-inject dynamic live presences even for cached lists to keep user states active
      const rooms = JSON.parse(cached);
      const allMemberIdsSet = new Set<string>();
      rooms.forEach((room: any) => {
        room.members.forEach((m: any) => allMemberIdsSet.add(m.id));
      });
      const allMemberIds = Array.from(allMemberIdsSet);
      const presences = await this.getMultiplePresences(allMemberIds);

      return rooms.map((room: any) => ({
        ...room,
        members: room.members.map((member: any) => ({
          ...member,
          presence: presences[member.id] || 'offline',
        })),
      }));
    }

    const rooms = await this.chatRepository.findRoomsForEmployee(employeeId);
    
    const allMemberIdsSet = new Set<string>();
    rooms.forEach((room) => {
      room.members.forEach((m) => allMemberIdsSet.add(m.id));
    });
    const allMemberIds = Array.from(allMemberIdsSet);
    const presences = await this.getMultiplePresences(allMemberIds);

    const enriched = rooms.map((room) => ({
      ...room,
      members: room.members.map((member) => ({
        ...member,
        presence: presences[member.id] || 'offline',
      })),
    }));

    // Cache user room views for 5 minutes (strip presence field from cache to save space)
    const cleanForCache = enriched.map((room) => ({
      ...room,
      members: room.members.map(({ presence, ...member }) => member),
    }));
    await this.redis.setex(cacheKey, 300, JSON.stringify(cleanForCache));
    return enriched;
  }

  /**
   * Retrieve or create a DM conversation with a recipient (invalidates caching maps)
   */
  async getOrCreateDirectRoom(creatorId: string, recipientId: string) {
    if (creatorId === recipientId) {
      throw new BadRequestException('Cannot message yourself');
    }

    let room = await this.chatRepository.findDirectMessageRoom(creatorId, recipientId);
    if (!room) {
      room = await this.chatRepository.createDirectMessageRoom(creatorId, recipientId);
      // Invalidate room lists cache for both participants
      await this.redis.del(`chat:rooms:user:${creatorId}`);
      await this.redis.del(`chat:rooms:user:${recipientId}`);

      // Publish event to Redis for real-time room sync
      await this.redis.publish(
        'chat_events',
        JSON.stringify({
          type: 'ROOM_CREATED',
          roomId: room.id,
          members: [creatorId, recipientId],
        })
      );
    }

    // Return the fully enriched room representation for the creator
    const userRooms = await this.getUserRooms(creatorId);
    const enrichedRoom = userRooms.find((r: any) => r.id === room.id);
    return enrichedRoom || room;
  }

  /**
   * Create a public or private group channel
   */
  async createChannel(creatorId: string, name: string, description: string, isPrivate: boolean) {
    if (!name || name.trim().length === 0) {
      throw new BadRequestException('Channel name is required');
    }
    const room = await this.chatRepository.createChannelRoom(creatorId, name.trim(), description, isPrivate);
    // Invalidate rooms list for the owner/creator
    await this.redis.del(`chat:rooms:user:${creatorId}`);

    // Publish event to Redis for real-time room sync
    await this.redis.publish(
      'chat_events',
      JSON.stringify({
        type: 'ROOM_CREATED',
        roomId: room.id,
        members: [creatorId],
      })
    );

    return room;
  }

  /**
   * Add a member to a group room
   */
  async addMemberToRoom(roomId: string, employeeId: string, requestorId: string) {
    const room = await this.chatRepository.findRoomById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    if (room.type !== 'channel') {
      throw new BadRequestException('Can only add members to channel rooms');
    }

    const isRequestorMember = await this.chatRepository.isMember(roomId, requestorId);
    if (!isRequestorMember) {
      throw new BadRequestException('You must be a member of the room to invite others');
    }

    const member = await this.chatRepository.addMember(roomId, employeeId);
    // Invalidate room lists cache for the added member
    await this.invalidateRoomsCacheForRoom(roomId);

    // Publish event to Redis for real-time member join sync
    const members = await this.chatRepository.getRoomMembers(roomId);
    await this.redis.publish(
      'chat_events',
      JSON.stringify({
        type: 'ROOM_JOINED',
        roomId,
        joinedMemberId: employeeId,
        members: members.map((m) => m.id),
      })
    );

    return member;
  }

  /**
   * Remove a member from a group room
   */
  async removeMemberFromRoom(roomId: string, employeeId: string, requestorId: string) {
    const room = await this.chatRepository.findRoomById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    if (room.type !== 'channel') {
      throw new BadRequestException('Can only remove members from channel rooms');
    }

    const members = await this.chatRepository.getRoomMembers(roomId);

    if (employeeId !== requestorId) {
      const requestor = members.find((m) => m.id === requestorId);
      if (!requestor || (requestor.role !== 'owner' && requestor.role !== 'admin')) {
        throw new BadRequestException('Insufficient permissions to remove members');
      }
    }

    await this.chatRepository.removeMember(roomId, employeeId);
    
    // Invalidate rooms list for the leaving user and all other room members
    await this.redis.del(`chat:rooms:user:${employeeId}`);
    await this.invalidateRoomsCacheForRoom(roomId);

    // Publish event to Redis for real-time member leave sync
    await this.redis.publish(
      'chat_events',
      JSON.stringify({
        type: 'ROOM_LEFT',
        roomId,
        leftMemberId: employeeId,
        members: members.map((m) => m.id),
      })
    );

    return { success: true };
  }

  /**
   * Fetch paginated message logs, using Redis caching for the default first page view.
   */
  async getRoomMessages(roomId: string, employeeId: string, limit = 50, cursor?: string) {
    const isMember = await this.chatRepository.isMember(roomId, employeeId);
    if (!isMember) {
      throw new BadRequestException('You do not belong to this room');
    }

    // Cache the default first page view (limit=50, cursor=null) for fast load speeds
    const isDefaultPage = limit === 50 && !cursor;
    const cacheKey = `chat:messages:room:${roomId}:default`;

    if (isDefaultPage) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const messages = await this.chatRepository.getRoomMessages(roomId, limit, cursor);

    if (isDefaultPage) {
      await this.redis.setex(cacheKey, 300, JSON.stringify(messages)); // Cache for 5 minutes
    }

    return messages;
  }

  /**
   * Save incoming message to database with sanitization and trigger notifications
   */
  async saveMessage(roomId: string, senderId: string, content: string) {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Message content cannot be empty');
    }
    if (content.length > 4000) {
      throw new BadRequestException('Message length cannot exceed 4000 characters');
    }

    // Sanitize input characters to defend against XSS injections
    const sanitizedContent = this.sanitizeText(content.trim());
    const message = await this.chatRepository.saveMessage(roomId, senderId, sanitizedContent);

    // Invalidate cache instances in background
    await this.invalidateRoomsCacheForRoom(roomId);

    // Trigger offline notification alerts asynchronously using BullMQ
    this.handleOfflineNotification(roomId, senderId, sanitizedContent).catch((err) => {
      this.logger.error('Failed to queue offline notification alerts', err);
    });

    return message;
  }

  /**
   * Edit a sent message (sanitizes text inputs)
   */
  async editMessage(messageId: string, senderId: string, content: string) {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Message content cannot be empty');
    }
    if (content.length > 4000) {
      throw new BadRequestException('Message length cannot exceed 4000 characters');
    }

    const sanitizedContent = this.sanitizeText(content.trim());
    const message = await this.chatRepository.editMessage(messageId, senderId, sanitizedContent);

    if (message) {
      await this.invalidateRoomsCacheForRoom(message.roomId);
    }
    return message;
  }

  /**
   * Soft-delete a sent message
   */
  async deleteMessage(messageId: string, senderId: string) {
    const message = await this.chatRepository.deleteMessage(messageId, senderId);
    if (message) {
      await this.invalidateRoomsCacheForRoom(message.roomId);
    }
    return message;
  }

  /**
   * Mark room as read for employee
   */
  async markAsRead(roomId: string, employeeId: string) {
    await this.chatRepository.updateLastRead(roomId, employeeId);
    // Invalidate the specific user's rooms cache so the unread Count drops to 0
    await this.redis.del(`chat:rooms:user:${employeeId}`);
  }

  /**
   * Search across messaging history
   */
  async searchMessages(employeeId: string, query: string) {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters long');
    }
    return this.chatRepository.searchMessages(employeeId, query.trim());
  }

  // ─── Cache & Queue Helpers ───

  /**
   * Evict room list caches for all members of a room, and clear the room's message cache
   */
  private async invalidateRoomsCacheForRoom(roomId: string) {
    const members = await this.chatRepository.getRoomMembers(roomId);
    const pipeline = this.redis.pipeline();
    members.forEach((m) => {
      pipeline.del(`chat:rooms:user:${m.id}`);
    });
    pipeline.del(`chat:messages:room:${roomId}:default`);
    await pipeline.exec();
  }

  /**
   * Escape raw HTML entities to secure message strings
   */
  private sanitizeText(content: string): string {
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Check for offline recipients and enqueue background alert jobs
   */
  private async handleOfflineNotification(roomId: string, senderId: string, content: string) {
    const members = await this.chatRepository.getRoomMembers(roomId);
    const offlineRecipients = [];

    const otherMemberIds = members.filter((m) => m.id !== senderId).map((m) => m.id);
    const presences = await this.getMultiplePresences(otherMemberIds);

    for (const member of members) {
      if (member.id === senderId) continue;
      const presence = presences[member.id] || 'offline';
      if (presence === 'offline') {
        offlineRecipients.push(member);
      }
    }

    if (offlineRecipients.length > 0) {
      await this.notificationQueue.add(
        'dispatch',
        {
          roomId,
          senderId,
          content,
          recipients: offlineRecipients.map((r) => ({
            id: r.id,
            email: r.email,
            name: r.fullNameEnglish,
          })),
        },
        {
          removeOnComplete: true,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        }
      );
    }
  }

  // ─── Active Call Tracking (Redis + DB Logs) ──────────────────────────────────

  /**
   * Track a new initiated call in Redis (active window cache)
   */
  async trackActiveCall(callId: string, callerId: string, calleeId: string, roomId: string, type: 'audio' | 'video') {
    const callKey = `chat:active_call:${callId}`;
    const now = Date.now().toString();

    // Map call metadata in Redis
    await this.redis.hset(callKey, {
      callerId,
      calleeId,
      roomId,
      type,
      status: 'initiated',
      createdAt: now,
      connectedAt: '0',
    });
    // Set 5-minute expire timeout in case of client crash during initiation phase
    await this.redis.expire(callKey, 300);

    // Map users to this call
    await this.redis.setex(`chat:user_call:${callerId}`, 300, callId);
    await this.redis.setex(`chat:user_call:${calleeId}`, 300, callId);
  }

  /**
   * Update active call state to connected
   */
  async updateActiveCallStatus(callId: string, status: 'connected') {
    const callKey = `chat:active_call:${callId}`;
    const exists = await this.redis.exists(callKey);
    if (!exists) return;

    await this.redis.hset(callKey, {
      status,
      connectedAt: Date.now().toString(),
    });
    // Extend expiry on connection state to 2 hours for longer calls
    await this.redis.expire(callKey, 7200);

    // Get active call metadata to extend user mappings expiration
    const callData = await this.redis.hgetall(callKey);
    if (callData.callerId && callData.calleeId) {
      await this.redis.expire(`chat:user_call:${callData.callerId}`, 7200);
      await this.redis.expire(`chat:user_call:${callData.calleeId}`, 7200);
    }
  }

  /**
   * Retrieve active call metadata by ID
   */
  async getActiveCall(callId: string): Promise<Record<string, string> | null> {
    const callKey = `chat:active_call:${callId}`;
    const data = await this.redis.hgetall(callKey);
    if (!data || Object.keys(data).length === 0) return null;
    return data;
  }

  /**
   * Retrieve callId for user's active call if it exists
   */
  async getUserActiveCall(employeeId: string): Promise<string | null> {
    return this.redis.get(`chat:user_call:${employeeId}`);
  }

  /**
   * Clear active call keys from Redis cache
   */
  async clearActiveCall(callId: string) {
    const callData = await this.getActiveCall(callId);
    if (callData) {
      await this.redis.del(`chat:active_call:${callId}`);
      if (callData.callerId) await this.redis.del(`chat:user_call:${callData.callerId}`);
      if (callData.calleeId) await this.redis.del(`chat:user_call:${callData.calleeId}`);
    }
  }

  /**
   * Save a call log to PostgreSQL history
   */
  async logCallHistory(
    roomId: string,
    callerId: string,
    calleeId: string,
    type: 'audio' | 'video',
    status: 'missed' | 'rejected' | 'completed' | 'cancelled',
    duration = 0
  ) {
    try {
      await this.chatRepository.saveCallLog(roomId, callerId, calleeId, type, status, duration);
    } catch (err) {
      this.logger.error('Failed to log call history', err);
    }
  }
}
