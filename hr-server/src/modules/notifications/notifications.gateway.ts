import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger, Inject, OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import * as url from 'url';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/cache/cache.service';
import { ModuleRef } from '@nestjs/core';
import { NotificationService } from './notifications.service';

interface AuthenticatedWebSocket extends WebSocket {
  employeeId: string;
  isAlive: boolean;
}

@WebSocketGateway({
  path: '/notifications',
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationGateway.name);
  private localClients = new Map<string, AuthenticatedWebSocket[]>();

  private pubClient!: Redis;
  private subClient!: Redis;
  private heartbeatIntervalId!: NodeJS.Timeout;

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async afterInit() {
    this.logger.log('Notifications WebSocket Gateway Initialized');

    this.pubClient = this.redis.duplicate();
    this.subClient = this.redis.duplicate();

    await this.subClient.subscribe('notification_events');

    this.subClient.on('message', (channel, message) => {
      if (channel === 'notification_events') {
        try {
          const payload = JSON.parse(message);
          this.handleRedisSyncEvent(payload);
        } catch (err) {
          this.logger.error('Failed to parse Redis notification sync message', err);
        }
      }
    });

    // Start 30s heartbeats
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

  onModuleDestroy() {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
    }
    if (this.subClient) {
      this.subClient.quit();
    }
    if (this.pubClient) {
      this.pubClient.quit();
    }
  }

  async handleConnection(client: WebSocket, request: IncomingMessage) {
    const authClient = client as AuthenticatedWebSocket;
    authClient.isAlive = true;

    client.on('pong', () => {
      authClient.isAlive = true;
    });

    try {
      const parsedUrl = url.parse(request.url || '', true);
      const token = parsedUrl.query.token as string;

      if (!token) {
        this.logger.warn('Notifications WS connection rejected: Token missing');
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

      this.logger.log(`Client connected to notifications: ${employeeId} (${userSockets.length} sockets)`);

      this.sendToClient(authClient, 'connection_ack', { status: 'connected', employeeId });

      // Run reconnection sync catch-up
      await this.runReconnectionSync(authClient);

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Notifications WS connection rejected: JWT verification failed (${errMsg})`);
      client.close(4001, 'Unauthorized: Invalid token');
    }
  }

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
      // Record last seen key in Redis (expires in 7 days)
      const nowStr = new Date().toISOString();
      const existing = await this.redis.get(`notif:last_seen:${employeeId}`);
      if (!existing || new Date(nowStr) > new Date(existing)) {
        await this.redis.setex(`notif:last_seen:${employeeId}`, 604800, nowStr);
      }
      this.logger.log(`Client fully disconnected from notifications: ${employeeId}`);
    } else {
      this.localClients.set(employeeId, userSockets);
      this.logger.log(`Tab closed for notifications client: ${employeeId}`);
    }
  }

  /**
   * Run reconnection sync catch-up for a user client who just reconnected
   */
  private async runReconnectionSync(client: AuthenticatedWebSocket) {
    const employeeId = client.employeeId;
    const lastSeenStr = await this.redis.get(`notif:last_seen:${employeeId}`);
    
    // Clear last seen key once processed
    await this.redis.del(`notif:last_seen:${employeeId}`);

    if (lastSeenStr) {
      const lastSeen = new Date(lastSeenStr);
      const service = this.moduleRef.get(NotificationService, { strict: false });
      
      // Delegate to NotificationService instead of direct DB query (Issue 6)
      const missedNotifications = await service.getRecentUnread(employeeId, 50);
      const filteredMissed = missedNotifications.filter(
        (n) => n.createdAt.getTime() > lastSeen.getTime(),
      );

      if (filteredMissed.length > 0) {
        this.sendToClient(client, 'reconnect_sync', {
          notifications: filteredMissed,
          lastSeenAt: lastSeenStr,
        });
      }
    }
  }

  /**
   * Send frame to specific client socket
   */
  private sendToClient(ws: WebSocket, event: string, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, data }));
    }
  }

  /**
   * Push an event to ALL active sockets for a specific employeeId
   */
  pushToUser(employeeId: string, event: string, data: any) {
    const sockets = this.localClients.get(employeeId) || [];
    sockets.forEach((ws) => {
      this.sendToClient(ws, event, data);
    });
  }

  /**
   * Publish sync notification event across instances using Redis Pub/Sub
   */
  async publishSyncEvent(type: string, recipientId: string, data: any) {
    await this.pubClient.publish(
      'notification_events',
      JSON.stringify({ type, recipientId, data })
    );
  }

  /**
   * Handle events synced across multiple horizontal application instances via Redis Pub/Sub
   */
  private handleRedisSyncEvent(payload: any) {
    const { type, recipientId, data } = payload;
    const sockets = this.localClients.get(recipientId);

    if (sockets && sockets.length > 0) {
      sockets.forEach((ws) => {
        if (type === 'NEW_NOTIFICATION') {
          this.sendToClient(ws, 'notification_new', data);
        } else if (type === 'NOTIFICATION_READ') {
          this.sendToClient(ws, 'notification_read', data);
        } else if (type === 'NOTIFICATION_MARK_ALL_READ') {
          this.sendToClient(ws, 'notification_mark_all_read', data);
        } else if (type === 'NOTIFICATION_ARCHIVED') {
          this.sendToClient(ws, 'notification_archived', data);
        } else if (type === 'NOTIFICATION_DELETED') {
          this.sendToClient(ws, 'notification_deleted', data);
        } else if (type === 'NOTIFICATION_ACTION_RESULT') {
          this.sendToClient(ws, 'notification_action_result', data);
        }
      });
    }
  }
}
