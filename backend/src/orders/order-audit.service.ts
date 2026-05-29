import { Injectable } from '@nestjs/common';
import { OrderAuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderAuditService {
  constructor(private prisma: PrismaService) {}

  log(
    orderId: string,
    userId: string,
    action: OrderAuditAction,
    details?: Prisma.InputJsonValue,
  ) {
    return this.prisma.orderAuditLog.create({
      data: { orderId, userId, action, details: details ?? undefined },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  findByOrder(orderId: string) {
    return this.prisma.orderAuditLog.findMany({
      where: { orderId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
