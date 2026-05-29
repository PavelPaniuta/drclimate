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

  private async countUnreadForAdmin(masterId: string) {
    const thread = await this.prisma.masterChatThread.findUnique({ where: { masterId } });
    if (!thread) return 0;
    return this.prisma.masterChatMessage.count({
      where: {
        threadId: thread.id,
        senderId: masterId,
        createdAt: { gt: thread.adminLastReadAt ?? new Date(0) },
      },
    });
  }

  async getAdminUnreadSummary() {
    const masters = await this.prisma.user.findMany({
      where: { role: Role.MASTER, isBanned: false },
      select: { id: true },
    });
    const byMaster: Record<string, number> = {};
    let total = 0;
    for (const m of masters) {
      const count = await this.countUnreadForAdmin(m.id);
      byMaster[m.id] = count;
      total += count;
    }
    return { total, byMaster };
  }

  async getMasterUnreadCount(masterId: string) {
    const thread = await this.prisma.masterChatThread.findUnique({ where: { masterId } });
    if (!thread) return 0;
    return this.prisma.masterChatMessage.count({
      where: {
        threadId: thread.id,
        senderId: { not: masterId },
        createdAt: { gt: thread.masterLastReadAt ?? new Date(0) },
      },
    });
  }

  async markAdminRead(masterId: string) {
    const thread = await this.getOrCreateThread(masterId);
    await this.prisma.masterChatThread.update({
      where: { id: thread.id },
      data: { adminLastReadAt: new Date() },
    });
    void this.events.emitChatUnread(masterId);
    return { ok: true };
  }

  async markMasterRead(masterId: string) {
    const thread = await this.getOrCreateThread(masterId);
    await this.prisma.masterChatThread.update({
      where: { id: thread.id },
      data: { masterLastReadAt: new Date() },
    });
    void this.events.emitChatUnread(masterId);
    return { ok: true };
  }

  async listMastersForAdmin() {
    const masters = await this.prisma.user.findMany({
      where: { role: Role.MASTER, isBanned: false },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        telegram: true,
        city: true,
        masterProfile: {
          select: {
            isOnline: true,
            serviceArea: true,
            totalEarnings: true,
            avatarUrl: true,
            bio: true,
          },
        },
        masterChatThread: {
          select: {
            updatedAt: true,
            adminLastReadAt: true,
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

    const withUnread = await Promise.all(
      masters.map(async (m) => ({
        ...m,
        unreadCount: await this.countUnreadForAdmin(m.id),
      })),
    );

    return withUnread.sort((a, b) => {
      if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
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
    const messages = await this.prisma.masterChatMessage.findMany({
      where: { threadId: thread.id },
      include: {
        sender: { select: { id: true, name: true, role: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (role === Role.ADMIN) {
      await this.markAdminRead(masterId);
    } else {
      await this.markMasterRead(masterId);
    }

    return messages;
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

    if (role === Role.ADMIN) {
      await this.markAdminRead(masterId);
    } else if (role === Role.MASTER && senderId === masterId) {
      await this.markMasterRead(masterId);
    }

    this.events.emitMasterChatMessage(masterId, message);
    void this.events.emitChatUnread(masterId);
    return message;
  }
}
