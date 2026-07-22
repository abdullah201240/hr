import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Logger, Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/cache/cache.service';

@Injectable()
@WebSocketGateway({
  path: '/ws',
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private pubClient!: Redis;
  private subClient!: Redis;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async afterInit(server: Server) {
    this.logger.log('Realtime WebSocket Gateway initialized');

    this.pubClient = this.redis;
    this.subClient = this.redis.duplicate();

    await this.subClient.subscribe('task_events');

    this.subClient.on('message', (channel, message) => {
      if (channel === 'task_events') {
        try {
          const payload = JSON.parse(message);
          this.broadcastLocal(payload.event, payload.data);
        } catch (err) {
          this.logger.error('Failed to parse Redis task event sync message', err);
        }
      }
    });
  }

  handleConnection(client: WebSocket) {
    this.logger.log('Client connected to Realtime Gateway');
  }

  handleDisconnect(client: WebSocket) {
    this.logger.log('Client disconnected from Realtime Gateway');
  }

  onModuleDestroy() {
    if (this.subClient) {
      this.subClient.quit();
    }
  }

  /**
   * Publish event to Redis Pub/Sub so all server instances broadcast it locally
   */
  async broadcast(event: string, data: any) {
    try {
      await this.pubClient.publish(
        'task_events',
        JSON.stringify({ event, data }),
      );
    } catch (err) {
      this.logger.error('Failed to publish task event to Redis Pub/Sub', err);
      // Fallback: broadcast locally if Redis publish fails
      this.broadcastLocal(event, data);
    }
  }

  /**
   * Broadcast message to local connections attached to this instance
   */
  private broadcastLocal(event: string, data: any) {
    if (!this.server || !this.server.clients) {
      return;
    }
    const payload = JSON.stringify({ event, data });
    this.server.clients.forEach((client: any) => {
      if (client.readyState === 1) { // 1 means OPEN in ws/WebSocket
        client.send(payload);
      }
    });
  }
}
