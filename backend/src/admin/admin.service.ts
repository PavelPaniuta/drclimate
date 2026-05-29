import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { AdminCreateOrderDto, AdminUpdateOrderDto } from '../orders/dto/order.dto';
import { OrderAuditService } from '../orders/order-audit.service';
import { AdminUpdateUserDto } from './dto/admin-user.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
    private orderAudit: OrderAuditService,
  ) {}

  getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        phone: true,
        address: true,
        telegram: true,
        city: true,
        isBanned: true,
        createdAt: true,
        masterProfile: {
          select: {
            isOnline: true,
            serviceArea: true,
            totalEarnings: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private userDetailSelect() {
    return {
      id: true,
      email: true,
      role: true,
      name: true,
      phone: true,
      address: true,
      telegram: true,
      city: true,
      isBanned: true,
      createdAt: true,
      updatedAt: true,
      masterProfile: {
        include: {
          workPhotos: { orderBy: { sortOrder: 'asc' as const } },
        },
      },
      _count: {
        select: { clientOrders: true, masterOrders: true },
      },
    };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.userDetailSelect(),
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(userId: string, dto: AdminUpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { masterProfile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === Role.ADMIN) {
      throw new BadRequestException('Admin accounts cannot be edited here');
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException('Email already in use');
    }

    const { masterProfile, ...userFields } = dto;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: userFields.email,
        name: userFields.name,
        phone: userFields.phone,
        address: userFields.address,
        telegram: userFields.telegram,
        city: userFields.city,
        isBanned: userFields.isBanned,
      },
    });

    if (user.role === Role.MASTER && masterProfile && user.masterProfile) {
      if (
        masterProfile.workDayStart !== undefined &&
        masterProfile.workDayEnd !== undefined &&
        masterProfile.workDayStart >= masterProfile.workDayEnd
      ) {
        throw new BadRequestException('Work day start must be before end');
      }
      await this.prisma.masterProfile.update({
        where: { userId },
        data: masterProfile,
      });
    }

    return this.getUserById(userId);
  }

  getOrders() {
    return this.ordersService.findAll();
  }

  banUser(userId: string, isBanned: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isBanned },
      select: { id: true, email: true, isBanned: true },
    });
  }

  createOrder(dto: AdminCreateOrderDto, adminId: string) {
    const { clientId, ...orderData } = dto;
    return this.ordersService.create(clientId, orderData, adminId);
  }

  updateOrder(orderId: string, adminId: string, dto: AdminUpdateOrderDto) {
    return this.ordersService.adminUpdate(orderId, adminId, dto);
  }

  getOrderAudit(orderId: string) {
    return this.orderAudit.findByOrder(orderId);
  }
}
