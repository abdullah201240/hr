import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, Inject, UsePipes, ValidationPipe, OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { randomUUID } from 'node:crypto';
import * as url from 'url';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/cache/cache.service';
import { ChatService } from './chat.service';
import {
  WSMessageDto,
  WSTypingDto,
  WSReadReceiptDto,
  WSEditMessageDto,
  WSDeleteMessageDto,
  WSCallInitiateDto,
  WSCallAcceptDto,
  WSCallRejectDto,
  WSCallCancelDto,
  WSCallHangupDto,
  WSWebRTCSignalDto,
  WSCallRingingDto,
} from './dto/create-room.dto';

interface AuthenticatedWebSocket extends WebSocket {
  employeeId: string;
  isAlive: boolean;
}

@WebSocketGateway({
  path: '/chat',
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  private readonly logger = new Logger(ChatGateway.name);
  private localClients = new Map<string, AuthenticatedWebSocket[]>();
  
  private readonly instanceId = randomUUID();
  private pubClient!: Redis;
  private subClient!: Redis;
  private heartbeatIntervalId!: NodeJS.Timeout;
  private nodeHeartbeatIntervalId!: NodeJS.Timeout;

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis
  ) {}

  /**
   * Initialize gateway and set up Redis Pub/Sub subscription for multi-instance sync
   */
  async afterInit() {
    this.logger.log(`WebSocket Gateway Initialized (Instance: ${this.instanceId})`);
    
    this.pubClient = this.redis;
    this.subClient = this.redis.duplicate();

    await this.subClient.subscribe('chat_events');
    
    this.subClient.on('message', (channel, message) => {
      if (channel === 'chat_events') {
        try {
          const payload = JSON.parse(message);
          this.handleRedisSyncEvent(payload);
        } catch (err) {
          this.logger.error('Failed to parse Redis sync message', err);
        }
      }
    });

    // Node cluster heartbeat (expires in 45s, runs every 15s)
    const updateHeartbeat = async () => {
      try {
        await this.redis.setex(`nodes:heartbeat:${this.instanceId}`, 45, 'alive');
        await this.redis.sadd('nodes:active', this.instanceId);
      } catch (err) {
        this.logger.error('Failed to update node heartbeat in Redis', err);
      }
    };
    await updateHeartbeat();
    this.nodeHeartbeatIntervalId = setInterval(updateHeartbeat, 15000);

    // Start heartbeat check interval (every 30 seconds)
    this.heartbeatIntervalId = setInterval(() => {
      this.localClients.forEach((sockets) => {
        sockets.forEach((ws) => {
          if (!ws.isAlive) {
            ws.terminate();
            return;
          }
          ws.isAlive = false;
          ws.ping();
        });
      });
    }, 30000);
  }

  /**
   * Clear interval on module destroy to prevent memory leaks during hot reloads
   */
  async onModuleDestroy() {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.logger.log('WebSocket heartbeat interval cleared');
    }
    if (this.nodeHeartbeatIntervalId) {
      clearInterval(this.nodeHeartbeatIntervalId);
    }

    // Graceful shutdown: remove node heartbeat and clean up local connection counts
    try {
      await this.redis.del(`nodes:heartbeat:${this.instanceId}`);
      await this.redis.srem('nodes:active', this.instanceId);

      const keys = await this.redis.keys('presence:nodes:*');
      if (keys.length > 0) {
        const pipeline = this.redis.pipeline();
        keys.forEach(key => {
          pipeline.hdel(key, this.instanceId);
        });
        await pipeline.exec();
      }
    } catch (err) {
      this.logger.error('Failed to clean up node session on shutdown', err);
    }

    if (this.subClient) {
      this.subClient.quit();
    }
  }

  /**
   * Retrieve total connections across all alive nodes in the cluster
   */
  private async getClusterConnectionCount(employeeId: string): Promise<number> {
    const activeKey = `presence:nodes:${employeeId}`;
    const fields = await this.redis.hgetall(activeKey);
    if (!fields || Object.keys(fields).length === 0) return 0;

    const nodeIds = Object.keys(fields);
    
    const pipeline = this.redis.pipeline();
    nodeIds.forEach(nodeId => {
      pipeline.exists(`nodes:heartbeat:${nodeId}`);
    });
    const results = await pipeline.exec();

    let total = 0;
    for (let i = 0; i < nodeIds.length; i++) {
      const nodeId = nodeIds[i];
      const exists = results ? (results[i][1] as number) : 0;
      if (exists === 1) {
        total += parseInt(fields[nodeId], 10);
      } else {
        // Node died: clean up its orphaned field
        await this.redis.hdel(activeKey, nodeId).catch(() => null);
        await this.redis.srem('nodes:active', nodeId).catch(() => null);
      }
    }

    return total;
  }

  /**
   * Handle incoming connection and authenticate via JWT token in URL query params
   */
  async handleConnection(client: WebSocket, request: IncomingMessage) {
    const authClient = client as AuthenticatedWebSocket;
    authClient.isAlive = true;

    // Monitor PONG replies from clients to confirm active link and refresh presence TTL
    client.on('pong', () => {
      authClient.isAlive = true;
      if (authClient.employeeId) {
        this.chatService.setUserOnline(authClient.employeeId).catch((err) => {
          this.logger.error('Failed to refresh user presence TTL on pong', err);
        });
      }
    });

    try {
      const parsedUrl = url.parse(request.url || '', true);
      const token = parsedUrl.query.token as string;

      if (!token) {
        this.logger.warn('Connection rejected: Token not provided');
        client.close(4001, 'Unauthorized: Token missing');
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.accessTokenSecret'),
      });

      const employeeId = payload.sub;
      authClient.employeeId = employeeId;

      const userSockets = this.localClients.get(employeeId) || [];
      userSockets.push(authClient);
      this.localClients.set(employeeId, userSockets);

      // Increment cluster connection registry
      const activeKey = `presence:nodes:${employeeId}`;
      const countBefore = await this.getClusterConnectionCount(employeeId);
      await this.redis.hincrby(activeKey, this.instanceId, 1);

      if (countBefore === 0) {
        await this.chatService.setUserOnline(employeeId);
        this.broadcastPresenceEvent(employeeId, 'online');
      }

      this.logger.log(`Client connected: ${employeeId} (${userSockets.length} local sockets, ${countBefore + 1} cluster connections)`);

      this.sendToClient(authClient, 'connection_ack', { status: 'connected', employeeId });

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Connection rejected: JWT verification failed (${errMsg})`);
      client.close(4001, 'Unauthorized: Invalid token');
    }
  }

  /**
   * Clean up socket maps and set user presence as offline when disconnecting
   */
  async handleDisconnect(client: WebSocket) {
    const authClient = client as AuthenticatedWebSocket;
    const employeeId = authClient.employeeId;

    if (!employeeId) return;

    const userSockets = this.localClients.get(employeeId) || [];
    const index = userSockets.indexOf(authClient);
    if (index !== -1) {
      userSockets.splice(index, 1);
    }

    if (userSockets.length === 0) {
      this.localClients.delete(employeeId);
      this.logger.log(`Client fully disconnected locally: ${employeeId}`);
    } else {
      this.localClients.set(employeeId, userSockets);
      this.logger.log(`Tab closed for client locally: ${employeeId} (${userSockets.length} local sockets left)`);
    }

    // Decrement cluster connection registry
    const activeKey = `presence:nodes:${employeeId}`;
    const remainingLocal = await this.redis.hincrby(activeKey, this.instanceId, -1);
    if (remainingLocal <= 0) {
      await this.redis.hdel(activeKey, this.instanceId);
    }

    const countAfter = await this.getClusterConnectionCount(employeeId);
    if (countAfter === 0) {
      await this.redis.del(activeKey);
      await this.chatService.setUserOffline(employeeId);
      this.broadcastPresenceEvent(employeeId, 'offline');
      this.logger.log(`Client fully offline cluster-wide: ${employeeId}`);

      // Auto-hangup active calls when user goes offline cluster-wide
      try {
        const activeCallId = await this.chatService.getUserActiveCall(employeeId);
        if (activeCallId) {
          const callData = await this.chatService.getActiveCall(activeCallId);
          if (callData) {
            const peerId = employeeId === callData.callerId ? callData.calleeId : callData.callerId;
            const status = callData.status === 'connected' ? 'completed' : 'cancelled';
            const duration = status === 'completed' ? Math.max(0, Math.round((Date.now() - Number(callData.connectedAt)) / 1000)) : 0;
            const eventType = callData.status === 'connected' ? 'CALL_HANGUP' : (employeeId === callData.callerId ? 'CALL_CANCEL' : 'CALL_REJECT');

            await this.pubClient.publish(
              'chat_events',
              JSON.stringify({
                type: eventType,
                members: [peerId],
                callId: activeCallId,
                targetUserId: peerId,
                calleeId: employeeId,
              })
            );

            await this.chatService.logCallHistory(
              callData.roomId,
              callData.callerId,
              callData.calleeId,
              callData.type as 'audio' | 'video',
              status,
              duration
            );

            await this.chatService.clearActiveCall(activeCallId);
          }
        }
      } catch (err) {
        this.logger.error(`Failed to handle call cleanup on disconnect for user ${employeeId}`, err);
      }
    } else {
      this.logger.log(`Client disconnected socket, but has ${countAfter} active cluster connections: ${employeeId}`);
    }
  }

  // ─── WebSocket Incoming Event Subscribers ────────────────────────────────────

  /**
   * Handle real-time text message sending with authorization and rate limiting
   */
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('sendMessage')
  async onSendMessage(@ConnectedSocket() client: AuthenticatedWebSocket, @MessageBody() data: WSMessageDto) {
    const senderId = client.employeeId;

    // Refresh presence TTL on activity
    await this.chatService.setUserOnline(senderId);

    // 1. Sliding-window rate limit (Max 30 messages/min)
    const canSend = await this.checkRateLimit(senderId);
    if (!canSend) {
      this.sendToClient(client, 'error', { message: 'Rate limit exceeded (max 30 messages/min)' });
      return;
    }

    // 2. Authorization check: Is sender a member of this room?
    const isMember = await this.chatService.isMember(data.roomId, senderId);
    if (!isMember) {
      this.sendToClient(client, 'error', { message: 'Unauthorized: You are not a member of this room' });
      return;
    }

    try {
      const message = await this.chatService.saveMessage(data.roomId, senderId, data.content);

      // Fetch list of members to broadcast (optimized: avoids loading all user rooms)
      const members = await this.chatService.getRoomMembers(data.roomId);
      const sender = members.find((m: any) => m.id === senderId);
      
      const broadcastPayload = {
        id: message.id,
        roomId: message.roomId,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt,
        isEdited: message.isEdited,
        isDeleted: message.isDeleted,
        senderName: sender?.fullNameEnglish || 'Unknown',
        senderPhotoUrl: sender?.employeePhotoUrl || null,
        clientMessageId: data.clientMessageId,
      };

      await this.pubClient.publish(
        'chat_events',
        JSON.stringify({
          type: 'NEW_MESSAGE',
          roomId: data.roomId,
          message: broadcastPayload,
          senderId,
          members: members.map((m: any) => m.id),
        })
      );

      await this.chatService.markAsRead(data.roomId, senderId);

    } catch (err) {
      this.logger.error('Failed to process message send', err);
      this.sendToClient(client, 'error', { message: 'Failed to send message' });
    }
  }

  /**
   * Edit a sent message
   */
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('editMessage')
  async onEditMessage(@ConnectedSocket() client: AuthenticatedWebSocket, @MessageBody() data: WSEditMessageDto) {
    const senderId = client.employeeId;
    await this.chatService.setUserOnline(senderId);

    try {
      const updated = await this.chatService.editMessage(data.messageId, senderId, data.content);
      if (!updated) {
        this.sendToClient(client, 'error', { message: 'Failed to edit message. Verify ownership.' });
        return;
      }

      const members = await this.chatService.getRoomMembers(updated.roomId);
      const sender = members.find((m: any) => m.id === senderId);

      await this.pubClient.publish(
        'chat_events',
        JSON.stringify({
          type: 'MESSAGE_EDIT',
          roomId: updated.roomId,
          message: {
            id: updated.id,
            roomId: updated.roomId,
            senderId: updated.senderId,
            content: updated.content,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
            isEdited: updated.isEdited,
            isDeleted: updated.isDeleted,
            senderName: sender?.fullNameEnglish || 'Unknown',
            senderPhotoUrl: sender?.employeePhotoUrl || null,
          },
          members: members.map((m: any) => m.id),
        })
      );

    } catch (err) {
      this.logger.error('Failed to process message edit', err);
      this.sendToClient(client, 'error', { message: 'Failed to edit message' });
    }
  }

  /**
   * Soft-delete a sent message
   */
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('deleteMessage')
  async onDeleteMessage(@ConnectedSocket() client: AuthenticatedWebSocket, @MessageBody() data: WSDeleteMessageDto) {
    const senderId = client.employeeId;
    await this.chatService.setUserOnline(senderId);

    try {
      const updated = await this.chatService.deleteMessage(data.messageId, senderId);
      if (!updated) {
        this.sendToClient(client, 'error', { message: 'Failed to delete message. Verify ownership.' });
        return;
      }

      const members = await this.chatService.getRoomMembers(updated.roomId);
      const sender = members.find((m: any) => m.id === senderId);

      await this.pubClient.publish(
        'chat_events',
        JSON.stringify({
          type: 'MESSAGE_DELETE',
          roomId: updated.roomId,
          messageId: updated.id,
          message: {
            id: updated.id,
            roomId: updated.roomId,
            senderId: updated.senderId,
            content: updated.content,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
            isEdited: updated.isEdited,
            isDeleted: updated.isDeleted,
            senderName: sender?.fullNameEnglish || 'Unknown',
            senderPhotoUrl: sender?.employeePhotoUrl || null,
          },
          members: members.map((m: any) => m.id),
        })
      );

    } catch (err) {
      this.logger.error('Failed to process message delete', err);
      this.sendToClient(client, 'error', { message: 'Failed to delete message' });
    }
  }

  /**
   * Broadcast typing status indicators to other members of the room
   */
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('typing')
  async onTyping(@ConnectedSocket() client: AuthenticatedWebSocket, @MessageBody() data: WSTypingDto) {
    const employeeId = client.employeeId;
    await this.chatService.setUserOnline(employeeId);

    const isMember = await this.chatService.isMember(data.roomId, employeeId);
    if (!isMember) return;

    const members = await this.chatService.getRoomMembers(data.roomId);
    const sender = members.find((m: any) => m.id === employeeId);

    await this.pubClient.publish(
      'chat_events',
      JSON.stringify({
        type: 'TYPING',
        roomId: data.roomId,
        employeeId,
        senderName: sender?.fullNameEnglish || 'Someone',
        isTyping: data.isTyping,
        members: members.map((m: any) => m.id),
      })
    );

  }

  /**
   * Handle read receipt notifications
   */
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('readReceipt')
  async onReadReceipt(@ConnectedSocket() client: AuthenticatedWebSocket, @MessageBody() data: WSReadReceiptDto) {
    const employeeId = client.employeeId;
    await this.chatService.setUserOnline(employeeId);

    const isMember = await this.chatService.isMember(data.roomId, employeeId);
    if (!isMember) return;

    try {
      await this.chatService.markAsRead(data.roomId, employeeId);

      const members = await this.chatService.getRoomMembers(data.roomId);

      await this.pubClient.publish(
        'chat_events',
        JSON.stringify({
          type: 'READ_RECEIPT',
          roomId: data.roomId,
          employeeId,
          members: members.map((m: any) => m.id),
        })
      );

    } catch (err) {
      this.logger.error('Failed to mark read receipt', err);
    }
  }

  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('call:initiate')
  async onCallInitiate(@ConnectedSocket() client: AuthenticatedWebSocket, @MessageBody() data: WSCallInitiateDto) {
    const callerId = client.employeeId;
    await this.chatService.setUserOnline(callerId);

    try {
      const members = await this.chatService.getRoomMembers(data.roomId);
      const recipient = members.find((m: any) => m.id !== callerId);

      if (!recipient) {
        this.sendToClient(client, 'error', { message: 'Recipient not found in room' });
        return;
      }

      // Check call rate limiting
      const canCall = await this.checkCallRateLimit(callerId);
      if (!canCall) {
        this.sendToClient(client, 'error', { message: 'Too many calls. Please wait a minute.' });
        return;
      }

      // Check if caller is already in an active call
      const callerActiveCall = await this.chatService.getUserActiveCall(callerId);
      if (callerActiveCall) {
        this.sendToClient(client, 'error', { message: 'You are already in an active call' });
        return;
      }

      // Check if recipient is already in an active call
      const recipientActiveCall = await this.chatService.getUserActiveCall(recipient.id);
      if (recipientActiveCall) {
        this.sendToClient(client, 'call_rejected', { reason: 'busy' });
        return;
      }

      const callId = `call_${randomUUID()}`;
      const caller = members.find((m: any) => m.id === callerId);

      // Track active call in Redis (active window cache)
      await this.chatService.trackActiveCall(callId, callerId, recipient.id, data.roomId, data.type);

      await this.pubClient.publish(
        'chat_events',
        JSON.stringify({
          type: 'CALL_INITIATE',
          members: [recipient.id],
          senderId: callerId,
          callId,
          callType: data.type,
          callerName: caller?.fullNameEnglish || 'Someone',
          callerPhotoUrl: caller?.employeePhotoUrl || null,
          roomId: data.roomId,
        })
      );

      this.sendToClient(client, 'call_initiated', {
        callId,
        type: data.type,
        peerId: recipient.id,
        peerName: recipient.fullNameEnglish,
        peerPhotoUrl: recipient.employeePhotoUrl || null,
      });

    } catch (err) {
      this.logger.error('Failed to initiate call', err);
      this.sendToClient(client, 'error', { message: 'Failed to initiate call' });
    }
  }

  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('call:accept')
  async onCallAccept(@ConnectedSocket() client: AuthenticatedWebSocket, @MessageBody() data: WSCallAcceptDto) {
    const calleeId = client.employeeId;
    await this.chatService.setUserOnline(calleeId);

    try {
      // Update active call state in Redis to connected and log connection timestamp
      await this.chatService.updateActiveCallStatus(data.callId, 'connected');

      await this.pubClient.publish(
        'chat_events',
        JSON.stringify({
          type: 'CALL_ACCEPT',
          members: [data.targetUserId, calleeId],
          callId: data.callId,
          calleeId,
        })
      );
    } catch (err) {
      this.logger.error('Failed to accept call', err);
    }
  }

  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('call:reject')
  async onCallReject(@ConnectedSocket() client: AuthenticatedWebSocket, @MessageBody() data: WSCallRejectDto) {
    const calleeId = client.employeeId;
    await this.chatService.setUserOnline(calleeId);

    try {
      // Save call reject log and clean cache
      const callData = await this.chatService.getActiveCall(data.callId);
      if (callData) {
        await this.chatService.logCallHistory(
          callData.roomId,
          callData.callerId,
          callData.calleeId,
          callData.type as 'audio' | 'video',
          'rejected',
          0
        );
        await this.chatService.clearActiveCall(data.callId);
      }

      await this.pubClient.publish(
        'chat_events',
        JSON.stringify({
          type: 'CALL_REJECT',
          members: [data.targetUserId, calleeId],
          callId: data.callId,
          calleeId,
          reason: data.reason || 'declined',
        })
      );
    } catch (err) {
      this.logger.error('Failed to reject call', err);
    }
  }

  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('call:ringing')
  async onCallRinging(@ConnectedSocket() client: AuthenticatedWebSocket, @MessageBody() data: WSCallRingingDto) {
    const calleeId = client.employeeId;
    await this.chatService.setUserOnline(calleeId);

    try {
      await this.pubClient.publish(
        'chat_events',
        JSON.stringify({
          type: 'CALL_RINGING',
          members: [data.targetUserId],
          callId: data.callId,
        })
      );
    } catch (err) {
      this.logger.error('Failed to publish call ringing event', err);
    }
  }

  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('call:cancel')
  async onCallCancel(@ConnectedSocket() client: AuthenticatedWebSocket, @MessageBody() data: WSCallCancelDto) {
    const callerId = client.employeeId;
    await this.chatService.setUserOnline(callerId);

    try {
      // Save call cancel log and clean cache
      const callData = await this.chatService.getActiveCall(data.callId);
      if (callData) {
        await this.chatService.logCallHistory(
          callData.roomId,
          callData.callerId,
          callData.calleeId,
          callData.type as 'audio' | 'video',
          'missed',
          0
        );
        await this.chatService.clearActiveCall(data.callId);
      }

      await this.pubClient.publish(
        'chat_events',
        JSON.stringify({
          type: 'CALL_CANCEL',
          members: [data.targetUserId],
          callId: data.callId,
        })
      );
    } catch (err) {
      this.logger.error('Failed to cancel call', err);
    }
  }

  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('call:hangup')
  async onCallHangup(@ConnectedSocket() client: AuthenticatedWebSocket, @MessageBody() data: WSCallHangupDto) {
    const senderId = client.employeeId;
    await this.chatService.setUserOnline(senderId);

    try {
      // Calculate call duration and save to SQL history
      const callData = await this.chatService.getActiveCall(data.callId);
      if (callData) {
        const status = callData.status === 'connected' ? 'completed' : 'cancelled';
        const duration = status === 'completed' ? Math.max(0, Math.round((Date.now() - Number(callData.connectedAt)) / 1000)) : 0;
        await this.chatService.logCallHistory(
          callData.roomId,
          callData.callerId,
          callData.calleeId,
          callData.type as 'audio' | 'video',
          status,
          duration
        );
        await this.chatService.clearActiveCall(data.callId);
      }

      await this.pubClient.publish(
        'chat_events',
        JSON.stringify({
          type: 'CALL_HANGUP',
          members: [data.targetUserId],
          callId: data.callId,
        })
      );
    } catch (err) {
      this.logger.error('Failed to hangup call', err);
    }
  }

  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('webrtc:signal')
  async onWebRTCSignal(@ConnectedSocket() client: AuthenticatedWebSocket, @MessageBody() data: WSWebRTCSignalDto) {
    const senderId = client.employeeId;
    await this.chatService.setUserOnline(senderId);

    try {
      await this.pubClient.publish(
        'chat_events',
        JSON.stringify({
          type: 'WEBRTC_SIGNAL',
          members: [data.targetUserId],
          callId: data.callId,
          senderId,
          signal: data.signal,
        })
      );
    } catch (err) {
      this.logger.error('Failed to forward WebRTC signal', err);
    }
  }

  // ─── Redis Events Processor ───

  /**
   * Process event packets received from Redis Pub/Sub cluster
   */
  private async handleRedisSyncEvent(payload: any) {
    const { type, roomId, members } = payload;

    if (members && Array.isArray(members)) {
      for (const memberId of members) {
        const userSockets = this.localClients.get(memberId);
        if (userSockets && userSockets.length > 0) {
          if (type === 'ROOM_CREATED' || type === 'ROOM_JOINED') {
            try {
              const rooms = await this.chatService.getUserRooms(memberId);
              const room = rooms.find((r: any) => r.id === roomId);
              if (room) {
                userSockets.forEach((ws) => {
                  this.sendToClient(ws, 'room_created', room);
                });
              }
            } catch (err) {
              this.logger.error(`Failed to fetch and send room details for member ${memberId}`, err);
            }
          } else if (type === 'ROOM_LEFT') {
            if (memberId === payload.leftMemberId) {
              userSockets.forEach((ws) => {
                this.sendToClient(ws, 'room_deleted', { roomId });
              });
            } else {
              try {
                const rooms = await this.chatService.getUserRooms(memberId);
                const room = rooms.find((r: any) => r.id === roomId);
                if (room) {
                  userSockets.forEach((ws) => {
                    this.sendToClient(ws, 'room_created', room);
                  });
                }
              } catch (err) {
                this.logger.error(`Failed to update room details after member departure for ${memberId}`, err);
              }
            }
          } else {
            userSockets.forEach((ws) => {
              if (type === 'NEW_MESSAGE') {
                this.sendToClient(ws, 'message', payload.message);
              } else if (type === 'MESSAGE_EDIT') {
                this.sendToClient(ws, 'message_edit', payload.message);
              } else if (type === 'MESSAGE_DELETE') {
                this.sendToClient(ws, 'message_delete', { roomId, messageId: payload.messageId, message: payload.message });
              } else if (type === 'TYPING' && payload.employeeId !== memberId) {
                this.sendToClient(ws, 'typing', {
                  roomId,
                  employeeId: payload.employeeId,
                  senderName: payload.senderName,
                  isTyping: payload.isTyping,
                });
              } else if (type === 'READ_RECEIPT') {
                this.sendToClient(ws, 'readReceipt', {
                  roomId,
                  employeeId: payload.employeeId,
                });
              } else if (type === 'CALL_INITIATE') {
                this.sendToClient(ws, 'call_incoming', {
                  callId: payload.callId,
                  callerId: payload.senderId,
                  callerName: payload.callerName,
                  callerPhotoUrl: payload.callerPhotoUrl,
                  type: payload.callType,
                  roomId: payload.roomId,
                });
              } else if (type === 'CALL_RINGING') {
                this.sendToClient(ws, 'call_ringing', {
                  callId: payload.callId,
                });
              } else if (type === 'CALL_ACCEPT') {
                this.sendToClient(ws, 'call_accepted', {
                  callId: payload.callId,
                  calleeId: payload.calleeId,
                });
              } else if (type === 'CALL_REJECT') {
                this.sendToClient(ws, 'call_rejected', {
                  callId: payload.callId,
                  reason: payload.reason,
                });
              } else if (type === 'CALL_CANCEL') {
                this.sendToClient(ws, 'call_cancelled', {
                  callId: payload.callId,
                });
              } else if (type === 'CALL_HANGUP') {
                this.sendToClient(ws, 'call_hungup', {
                  callId: payload.callId,
                });
              } else if (type === 'WEBRTC_SIGNAL') {
                this.sendToClient(ws, 'webrtc_signal', {
                  callId: payload.callId,
                  senderId: payload.senderId,
                  signal: payload.signal,
                });
              }
            });
          }
        }
      }
    }

    if (type === 'PRESENCE') {
      const { employeeId, status } = payload;
      this.localClients.forEach((sockets, localMemberId) => {
        if (localMemberId !== employeeId) {
          sockets.forEach((ws) => {
            this.sendToClient(ws, 'presence', { employeeId, status });
          });
        }
      });
    }
  }

  // ─── Utility Methods ───

  /**
   * Enforce a sliding-window message rate limit per employee (Max 30 messages/min)
   */
  private async checkRateLimit(employeeId: string): Promise<boolean> {
    const limitKey = `chat:ratelimit:${employeeId}`;
    const count = await this.redis.incr(limitKey);
    if (count === 1) {
      await this.redis.expire(limitKey, 60);
    }
    return count <= 30;
  }

  /**
   * Enforce a sliding-window call initiation rate limit per employee (Max 5 calls/min)
   */
  private async checkCallRateLimit(employeeId: string): Promise<boolean> {
    const limitKey = `chat:call_ratelimit:${employeeId}`;
    const count = await this.redis.incr(limitKey);
    if (count === 1) {
      await this.redis.expire(limitKey, 60);
    }
    return count <= 5;
  }

  /**
   * Send formatted JSON frame to client socket
   */
  private sendToClient(ws: WebSocket, event: string, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, data }));
    }
  }

  /**
   * Broadcast presence status updates
   */
  private async broadcastPresenceEvent(employeeId: string, status: 'online' | 'offline') {
    await this.pubClient.publish(
      'chat_events',
      JSON.stringify({
        type: 'PRESENCE',
        employeeId,
        status,
      })
    );
  }
}
