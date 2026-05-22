import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/projects',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class StatusGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { projectId: string }) {
    const room = `project:${payload.projectId}`;
    client.join(room);
    client.emit('subscribed', { room });
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, payload: { projectId: string }) {
    const room = `project:${payload.projectId}`;
    client.leave(room);
    client.emit('unsubscribed', { room });
  }

  sendStatusUpdate(projectId: string, data: { status: string; message?: string; progress?: number }) {
    this.server.to(`project:${projectId}`).emit('status.update', data);
  }
}
