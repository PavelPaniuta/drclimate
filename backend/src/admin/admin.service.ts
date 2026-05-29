import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { AdminCreateOrderDto, AdminUpdateOrderDto } from '../orders/dto/order.dto';
import { OrderAuditService } from '../orders/order-audit.service';

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
        masterProfile: { select: { isOnline: true, serviceArea: true, totalEarnings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
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
