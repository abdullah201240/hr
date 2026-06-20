import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Logger, Injectable } from '@nestjs/common';

const WS_PORT = parseInt(process.env.WS_PORT || '3001', 10);

@Injectable()
@WebSocketGateway(WS_PORT, {
  path: '/ws',
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  afterInit(server: Server) {
    this.logger.log(`Realtime WebSocket Gateway initialized on port ${WS_PORT}`);
  }

  handleConnection(client: WebSocket) {
    this.logger.log('Client connected to Realtime Gateway');
  }

  handleDisconnect(client: WebSocket) {
    this.logger.log('Client disconnected from Realtime Gateway');
  }

  broadcast(event: string, data: any) {
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
