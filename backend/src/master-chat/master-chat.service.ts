import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { SendMasterChatDto } from './dto/master-chat.dto';

@Injectable()
export class MasterChatService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  private async getOrCreateThread(masterId: string) {
    const master = await this.prisma.user.findUnique({
      where: { id: masterId },
      include: { masterProfile: true },
    });
    if (!master || master.role !== Role.MASTER) {
      throw new NotFoundException('Master not found');
    }

    return this.prisma.masterChatThread.upsert({
      where: { masterId },
      create: { masterId },
      update: {},
    });
  }

  async listMastersForAdmin() {
    const masters = await this.prisma.user.findMany({
      where: { role: Role.MASTER, isBanned: false },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        city: true,
        masterProfile: {
          select: {
            isOnline: true,
            serviceArea: true,
            totalEarnings: true,
          },
        },
        masterChatThread: {
          select: {
            updatedAt: true,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                content: true,
                createdAt: true,
                sender: { select: { id: true, name: true, role: true } },
              },
            },
          },
        },
        _count: {
          select: {
            masterOrders: {
              where: { status: { in: ['ACCEPTED', 'IN_PROGRESS'] } },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return masters.sort((a, b) => {
      const aOnline = a.masterProfile?.isOnline ? 1 : 0;
      const bOnline = b.masterProfile?.isOnline ? 1 : 0;
      return bOnline - aOnline;
    });
  }

  async getMessages(masterId: string, userId: string, role: Role) {
    if (role === Role.MASTER && userId !== masterId) {
      throw new ForbiddenException();
    }

    const thread = await this.getOrCreateThread(masterId);
    return this.prisma.masterChatMessage.findMany({
      where: { threadId: thread.id },
      include: {
        sender: { select: { id: true, name: true, role: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(
    masterId: string,
    senderId: string,
    role: Role,
    dto: SendMasterChatDto,
  ) {
    if (role === Role.MASTER && senderId !== masterId) {
      throw new ForbiddenException();
    }
    if (role !== Role.ADMIN && role !== Role.MASTER) {
      throw new ForbiddenException();
    }

    const thread = await this.getOrCreateThread(masterId);
    const message = await this.prisma.masterChatMessage.create({
      data: {
        threadId: thread.id,
        senderId,
        content: dto.content.trim(),
      },
      include: {
        sender: { select: { id: true, name: true, role: true, email: true } },
      },
    });

    await this.prisma.masterChatThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date() },
    });

    this.events.emitMasterChatMessage(masterId, message);
    return message;
  }
}
