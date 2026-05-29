import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { CreateMessageDto } from './dto/message.dto';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  private countUnreadForClient(order: {
    id: string;
    clientId: string;
    masterId: string | null;
    clientLastReadAt: Date | null;
  }) {
    if (!order.masterId) return 0;
    return this.prisma.message.count({
      where: {
        orderId: order.id,
        senderId: { not: order.clientId },
        createdAt: { gt: order.clientLastReadAt ?? new Date(0) },
      },
    });
  }

  private countUnreadForMaster(order: {
    id: string;
    masterId: string | null;
    masterLastReadAt: Date | null;
  }) {
    if (!order.masterId) return 0;
    return this.prisma.message.count({
      where: {
        orderId: order.id,
        senderId: { not: order.masterId },
        createdAt: { gt: order.masterLastReadAt ?? new Date(0) },
      },
    });
  }

  async getClientUnreadSummary(clientId: string) {
    const orders = await this.prisma.serviceRequest.findMany({
      where: {
        clientId,
        masterId: { not: null },
        status: { not: 'CANCELLED' },
      },
      select: {
        id: true,
        clientId: true,
        masterId: true,
        clientLastReadAt: true,
      },
    });
    const byOrder: Record<string, number> = {};
    let total = 0;
    for (const o of orders) {
      const count = await this.countUnreadForClient(o);
      byOrder[o.id] = count;
      total += count;
    }
    return { total, byOrder };
  }

  async getMasterUnreadSummary(masterId: string) {
    const orders = await this.prisma.serviceRequest.findMany({
      where: {
        masterId,
        status: { not: 'CANCELLED' },
      },
      select: {
        id: true,
        masterId: true,
        masterLastReadAt: true,
      },
    });
    const byOrder: Record<string, number> = {};
    let total = 0;
    for (const o of orders) {
      const count = await this.countUnreadForMaster(o);
      byOrder[o.id] = count;
      total += count;
    }
    return { total, byOrder };
  }

  private async markClientRead(orderId: string) {
    await this.prisma.serviceRequest.update({
      where: { id: orderId },
      data: { clientLastReadAt: new Date() },
    });
  }

  private async markMasterRead(orderId: string) {
    await this.prisma.serviceRequest.update({
      where: { id: orderId },
      data: { masterLastReadAt: new Date() },
    });
  }

  async send(orderId: string, senderId: string, role: Role, dto: CreateMessageDto) {
    const order = await this.prisma.serviceRequest.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const isParticipant =
      order.clientId === senderId ||
      order.masterId === senderId ||
      role === Role.ADMIN;

    if (!isParticipant) throw new ForbiddenException();
    if (!order.masterId) throw new ForbiddenException('Chat available after master is assigned');

    const message = await this.prisma.message.create({
      data: { orderId, senderId, content: dto.content },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });

    if (role === Role.CLIENT && order.clientId === senderId) {
      await this.markClientRead(orderId);
    } else if (role === Role.MASTER && order.masterId === senderId) {
      await this.markMasterRead(orderId);
    }

    this.events.emitNewMessage(orderId, message);
    void this.events.emitOrderChatUnread(orderId, order.clientId, order.masterId);
    return message;
  }

  async findByOrder(orderId: string, userId: string, role: Role) {
    const order = await this.prisma.serviceRequest.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const isParticipant =
      order.clientId === userId || order.masterId === userId || role === Role.ADMIN;
    if (!isParticipant) throw new ForbiddenException();

    const messages = await this.prisma.message.findMany({
      where: { orderId },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });

    if (role === Role.CLIENT && order.clientId === userId) {
      await this.markClientRead(orderId);
    } else if (role === Role.MASTER && order.masterId === userId) {
      await this.markMasterRead(orderId);
    } else if (role === Role.ADMIN) {
      await this.markClientRead(orderId);
      await this.markMasterRead(orderId);
    }

    if (order.masterId) {
      void this.events.emitOrderChatUnread(orderId, order.clientId, order.masterId);
    }

    return messages;
  }
}
