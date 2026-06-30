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
import { randomUUID } from 'node:crypto';
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

  private readonly instanceId = randomUUID();
  private pubClient!: Redis;
  private subClient!: Redis;
  private heartbeatIntervalId!: NodeJS.Timeout;
  private nodeHeartbeatIntervalId!: NodeJS.Timeout;

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async afterInit() {
    this.logger.log(`Notifications WebSocket Gateway Initialized (Instance: ${this.instanceId})`);

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

  async onModuleDestroy() {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
    }
    if (this.nodeHeartbeatIntervalId) {
      clearInterval(this.nodeHeartbeatIntervalId);
    }

    // Graceful shutdown: remove node heartbeat and clean up local connection counts
    try {
      await this.redis.del(`nodes:heartbeat:${this.instanceId}`);
      await this.redis.srem('nodes:active', this.instanceId);

      const keys = await this.redis.keys('notif:nodes:*');
      if (keys.length > 0) {
        const pipeline = this.redis.pipeline();
        keys.forEach(key => {
          pipeline.hdel(key, this.instanceId);
        });
        await pipeline.exec();
      }
    } catch (err) {
      this.logger.error('Failed to clean up notification node registry on shutdown', err);
    }

    if (this.subClient) {
      this.subClient.quit();
    }
    if (this.pubClient) {
      this.pubClient.quit();
    }
  }

  /**
   * Retrieve total notification connections across all alive nodes in the cluster
   */
  private async getClusterNotificationCount(employeeId: string): Promise<number> {
    const activeKey = `notif:nodes:${employeeId}`;
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

      // Increment cluster connection registry
      const activeKey = `notif:nodes:${employeeId}`;
      await this.redis.hincrby(activeKey, this.instanceId, 1);

      this.logger.log(`Client connected to notifications: ${employeeId} (${userSockets.length} local sockets)`);

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
      this.logger.log(`Client disconnected locally from notifications: ${employeeId}`);
    } else {
      this.localClients.set(employeeId, userSockets);
      this.logger.log(`Tab closed for notifications client locally: ${employeeId}`);
    }

    // Decrement cluster connection registry
    const activeKey = `notif:nodes:${employeeId}`;
    const remainingLocal = await this.redis.hincrby(activeKey, this.instanceId, -1);
    if (remainingLocal <= 0) {
      await this.redis.hdel(activeKey, this.instanceId);
    }

    const countAfter = await this.getClusterNotificationCount(employeeId);
    if (countAfter === 0) {
      await this.redis.del(activeKey);
      // Record last seen key in Redis (expires in 7 days)
      const nowStr = new Date().toISOString();
      const existing = await this.redis.get(`notif:last_seen:${employeeId}`);
      if (!existing || new Date(nowStr) > new Date(existing)) {
        await this.redis.setex(`notif:last_seen:${employeeId}`, 604800, nowStr);
      }
      this.logger.log(`Client fully disconnected from notifications cluster-wide: ${employeeId}`);
    } else {
      this.logger.log(`Client disconnected socket, but has ${countAfter} active cluster notification connections: ${employeeId}`);
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
