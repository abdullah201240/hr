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
  
  private pubClient!: Redis;
  private subClient!: Redis;
  private heartbeatIntervalId!: NodeJS.Timeout;

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
    this.logger.log('WebSocket Gateway Initialized');
    
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
  onModuleDestroy() {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.logger.log('WebSocket heartbeat interval cleared');
    }
    if (this.subClient) {
      this.subClient.quit();
    }
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

      await this.chatService.setUserOnline(employeeId);
      this.broadcastPresenceEvent(employeeId, 'online');

      this.logger.log(`Client connected: ${employeeId} (${userSockets.length} active sockets)`);

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
      await this.chatService.setUserOffline(employeeId);
      this.broadcastPresenceEvent(employeeId, 'offline');
      this.logger.log(`Client fully disconnected: ${employeeId}`);
    } else {
      this.localClients.set(employeeId, userSockets);
      this.logger.log(`Tab closed for client: ${employeeId} (${userSockets.length} remaining active sockets)`);
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

      // Fetch room metadata and list of members to broadcast
      const rooms = await this.chatService.getUserRooms(senderId);
      const room = rooms.find((r: any) => r.id === data.roomId);
      
      const broadcastPayload = {
        id: message.id,
        roomId: message.roomId,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt,
        isEdited: message.isEdited,
        isDeleted: message.isDeleted,
        senderName: room?.members.find((m: any) => m.id === senderId)?.fullNameEnglish || 'Unknown',
        senderPhotoUrl: room?.members.find((m: any) => m.id === senderId)?.employeePhotoUrl || null,
      };

      await this.pubClient.publish(
        'chat_events',
        JSON.stringify({
          type: 'NEW_MESSAGE',
          roomId: data.roomId,
          message: broadcastPayload,
          senderId,
          members: room?.members.map((m: any) => m.id) || [],
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

      const rooms = await this.chatService.getUserRooms(senderId);
      const room = rooms.find((r: any) => r.id === updated.roomId);

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
            senderName: room?.members.find((m: any) => m.id === senderId)?.fullNameEnglish || 'Unknown',
            senderPhotoUrl: room?.members.find((m: any) => m.id === senderId)?.employeePhotoUrl || null,
          },
          members: room?.members.map((m: any) => m.id) || [],
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

      const rooms = await this.chatService.getUserRooms(senderId);
      const room = rooms.find((r: any) => r.id === updated.roomId);

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
            senderName: room?.members.find((m: any) => m.id === senderId)?.fullNameEnglish || 'Unknown',
            senderPhotoUrl: room?.members.find((m: any) => m.id === senderId)?.employeePhotoUrl || null,
          },
          members: room?.members.map((m: any) => m.id) || [],
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

    const rooms = await this.chatService.getUserRooms(employeeId);
    const room = rooms.find((r: any) => r.id === data.roomId);
    if (!room) return;

    await this.pubClient.publish(
      'chat_events',
      JSON.stringify({
        type: 'TYPING',
        roomId: data.roomId,
        employeeId,
        senderName: room.members.find((m: any) => m.id === employeeId)?.fullNameEnglish || 'Someone',
        isTyping: data.isTyping,
        members: room.members.map((m: any) => m.id),
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

      const rooms = await this.chatService.getUserRooms(employeeId);
      const room = rooms.find((r: any) => r.id === data.roomId);
      if (!room) return;

      await this.pubClient.publish(
        'chat_events',
        JSON.stringify({
          type: 'READ_RECEIPT',
          roomId: data.roomId,
          employeeId,
          members: room.members.map((m: any) => m.id),
        })
      );

    } catch (err) {
      this.logger.error('Failed to mark read receipt', err);
    }
  }

  // ─── Redis Events Processor ───

  /**
   * Process event packets received from Redis Pub/Sub cluster
   */
  private handleRedisSyncEvent(payload: any) {
    const { type, roomId, members } = payload;

    if (members && Array.isArray(members)) {
      members.forEach((memberId) => {
        const userSockets = this.localClients.get(memberId);
        if (userSockets && userSockets.length > 0) {
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
            }
          });
        }
      });
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
