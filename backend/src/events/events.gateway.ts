import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { ServiceRequest } from '@prisma/client';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwt.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });

      client.data.userId = payload.sub;
      client.data.role = payload.role;
      client.join(`user:${payload.sub}`);
      client.join(`role:${payload.role}`);
      this.logger.log(`Client connected: ${payload.sub} (${payload.role})`);
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('join_order')
  handleJoinOrder(@ConnectedSocket() client: Socket, payload: { orderId: string }) {
    if (payload?.orderId) {
      client.join(`order:${payload.orderId}`);
    }
  }

  emitNewOrderToMaster(masterId: string, order: ServiceRequest) {
    this.server.to(`user:${masterId}`).emit('new_order', order);
  }

  emitOrderAccepted(order: ServiceRequest & { client?: unknown; master?: unknown }) {
    this.server.to(`user:${order.clientId}`).emit('order_accepted', order);
    this.server.to(`order:${order.id}`).emit('order_update', order);
  }

  emitOrderUpdate(order: ServiceRequest & { client?: unknown; master?: unknown }) {
    this.server.to(`order:${order.id}`).emit('order_update', order);
    this.server.to(`user:${order.clientId}`).emit('order_update', order);
    if (order.masterId) {
      this.server.to(`user:${order.masterId}`).emit('order_update', order);
    }
  }

  emitNewMessage(orderId: string, message: unknown) {
    this.server.to(`order:${orderId}`).emit('new_message', message);
  }

  emitOrderComment(orderId: string, comment: unknown) {
    this.server.to(`order:${orderId}`).emit('new_comment', comment);
  }

  emitMasterChatMessage(masterId: string, message: unknown) {
    this.server.to(`user:${masterId}`).emit('master_chat_message', message);
    this.server.to('role:ADMIN').emit('master_chat_message', { masterId, message });
  }

  async emitChatUnread(masterId: string) {
    const payload = { masterId, at: Date.now() };
    this.server.to(`user:${masterId}`).emit('chat_unread', payload);
    this.server.to('role:ADMIN').emit('chat_unread', payload);
  }
}
