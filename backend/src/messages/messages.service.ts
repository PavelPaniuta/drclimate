import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
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

  async send(orderId: string, senderId: string, role: Role, dto: CreateMessageDto) {
    const order = await this.prisma.serviceRequest.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const isParticipant =
      order.clientId === senderId ||
      order.masterId === senderId ||
      role === Role.ADMIN;

    if (!isParticipant) throw new ForbiddenException();

    const message = await this.prisma.message.create({
      data: { orderId, senderId, content: dto.content },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });

    this.events.emitNewMessage(orderId, message);
    return message;
  }

  async findByOrder(orderId: string, userId: string, role: Role) {
    const order = await this.prisma.serviceRequest.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const isParticipant =
      order.clientId === userId || order.masterId === userId || role === Role.ADMIN;
    if (!isParticipant) throw new ForbiddenException();

    return this.prisma.message.findMany({
      where: { orderId },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }
}
