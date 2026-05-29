import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMasterProfileDto, UpdateMasterWorkSettingsDto, UpdateAvailabilityDto } from './dto/master.dto';
import {
  defaultScheduleTime,
  getOrderWorkDate,
  isSameDay,
  startOfDay,
} from './master-work.utils';

const orderInclude = {
  client: { select: { id: true, name: true, email: true, phone: true } },
  master: { select: { id: true, name: true, email: true, phone: true } },
};

@Injectable()
export class MastersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.masterProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, city: true } },
      },
    });
    if (!profile) throw new NotFoundException('Master profile not found');
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateMasterProfileDto) {
    await this.getProfile(userId);

    if (dto.name || dto.phone) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { name: dto.name, phone: dto.phone },
      });
    }

    return this.prisma.masterProfile.update({
      where: { userId },
      data: {
        serviceArea: dto.serviceArea,
        bio: dto.bio,
        skills: dto.skills,
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, city: true } },
      },
    });
  }

  async updateWorkSettings(userId: string, dto: UpdateMasterWorkSettingsDto) {
    if (dto.workDayStart !== undefined && dto.workDayEnd !== undefined && dto.workDayStart >= dto.workDayEnd) {
      throw new BadRequestException('Work day start must be before end');
    }

    return this.prisma.masterProfile.update({
      where: { userId },
      data: dto,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, city: true } },
      },
    });
  }

  async setAvailability(userId: string, dto: UpdateAvailabilityDto) {
    return this.prisma.masterProfile.update({
      where: { userId },
      data: { isOnline: dto.isOnline },
    });
  }

  async countJobsForDay(masterId: string, day: Date) {
    const orders = await this.prisma.serviceRequest.findMany({
      where: {
        masterId,
        status: { in: [OrderStatus.ACCEPTED, OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED] },
      },
    });

    return orders.filter((o) => isSameDay(getOrderWorkDate(o), day)).length;
  }

  async canAcceptForDay(masterId: string, day: Date) {
    const profile = await this.getProfile(masterId);
    const count = await this.countJobsForDay(masterId, day);
    return {
      allowed: count < profile.maxJobsPerDay,
      count,
      limit: profile.maxJobsPerDay,
      remaining: Math.max(0, profile.maxJobsPerDay - count),
    };
  }

  async getWorkboard(userId: string) {
    const profile = await this.getProfile(userId);
    const today = startOfDay(new Date());

    const [incoming, assigned, earningsToday] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        where: { status: OrderStatus.PENDING, masterId: null },
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.serviceRequest.findMany({
        where: { masterId: userId },
        include: orderInclude,
        orderBy: [{ scheduledAt: 'asc' }, { preferredTime: 'asc' }, { updatedAt: 'desc' }],
      }),
      this.prisma.serviceRequest.findMany({
        where: { masterId: userId, status: OrderStatus.COMPLETED },
        select: {
          price: true,
          updatedAt: true,
          scheduledAt: true,
          preferredTime: true,
          settlement: { select: { netProfit: true } },
        },
      }),
    ]);

    const todayCapacity = await this.canAcceptForDay(userId, today);

    const active = assigned.filter(
      (o) => o.status === OrderStatus.ACCEPTED || o.status === OrderStatus.IN_PROGRESS,
    );
    const completed = assigned.filter((o) => o.status === OrderStatus.COMPLETED);
    const cancelled = assigned.filter((o) => o.status === OrderStatus.CANCELLED);
    const todayJobs = assigned.filter(
      (o) =>
        o.status !== OrderStatus.CANCELLED &&
        isSameDay(getOrderWorkDate(o), today),
    );

    const weekStart = startOfDay(today);
    const dayOfWeek = weekStart.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + mondayOffset);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dayOrders = assigned.filter(
        (o) =>
          o.status !== OrderStatus.CANCELLED &&
          isSameDay(getOrderWorkDate(o), date),
      );
      return {
        date: date.toISOString(),
        count: dayOrders.length,
        limit: profile.maxJobsPerDay,
        isToday: isSameDay(date, today),
        orders: dayOrders.map((o) => ({ id: o.id, status: o.status, serviceType: o.serviceType })),
      };
    });

    const todayEarnings = earningsToday
      .filter((o) => isSameDay(getOrderWorkDate(o), today))
      .reduce((sum, o) => sum + Number(o.settlement?.netProfit ?? o.price ?? 0), 0);

    return {
      profile,
      stats: {
        incoming: incoming.length,
        active: active.length,
        completed: completed.length,
        today: todayJobs.length,
        todayLimit: profile.maxJobsPerDay,
        todayRemaining: todayCapacity.remaining,
        todayEarnings,
        totalEarnings: profile.totalEarnings,
      },
      todayCapacity,
      weekDays,
      orders: {
        incoming,
        today: todayJobs,
        active,
        completed,
        cancelled,
        all: assigned,
      },
    };
  }

  async getEarnings(userId: string) {
    const profile = await this.getProfile(userId);
    const completed = await this.prisma.serviceRequest.findMany({
      where: { masterId: userId, status: 'COMPLETED' },
      select: {
        id: true,
        price: true,
        serviceType: true,
        updatedAt: true,
        scheduledAt: true,
        preferredTime: true,
        settlement: {
          include: { expenseItems: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      totalEarnings: profile.totalEarnings,
      completedJobs: completed.length,
      jobs: completed,
    };
  }
}
