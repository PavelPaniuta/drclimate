import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { OrderAuditAction, OrderStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MatchingService } from '../matching/matching.service';
import { EventsGateway } from '../events/events.gateway';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  ScheduleOrderDto,
  UpdateMasterNotesDto,
  CreateOrderCommentDto,
  CompleteOrderDto,
  AdminUpdateOrderDto,
} from './dto/order.dto';
import { OrderAuditService } from './order-audit.service';
import { userContactSelect, masterProfilePublicSelect } from '../common/prisma-selects';
import { calculateSettlementTotals, roundMoney } from './settlement.utils';
import { MastersService } from '../masters/masters.service';
import { CitiesService } from '../cities/cities.service';
import { defaultScheduleTime, getOrderWorkDate, isSameDay, startOfDay } from '../masters/master-work.utils';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED: [OrderStatus.PENDING, OrderStatus.CANCELLED],
  PENDING: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  ACCEPTED: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
  IN_PROGRESS: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private matching: MatchingService,
    private events: EventsGateway,
    private mastersService: MastersService,
    private citiesService: CitiesService,
    private audit: OrderAuditService,
  ) {}

  async create(clientId: string, dto: CreateOrderDto, actorId?: string) {
    const client = await this.prisma.user.findUnique({ where: { id: clientId } });
    if (!client || client.role !== Role.CLIENT) {
      throw new BadRequestException('Invalid client');
    }
    await this.citiesService.ensureExists(dto.city);
    const order = await this.prisma.serviceRequest.create({
      data: {
        clientId,
        serviceType: dto.serviceType,
        description: dto.description,
        address: dto.address,
        city: dto.city,
        preferredTime: dto.preferredTime ? new Date(dto.preferredTime) : undefined,
        price: dto.price !== undefined ? dto.price : undefined,
        status: OrderStatus.CREATED,
      },
      include: this.orderIncludes(),
    });

    const pending = await this.prisma.serviceRequest.update({
      where: { id: order.id },
      data: { status: OrderStatus.PENDING },
      include: this.orderIncludes(),
    });

    await this.matching.broadcastToMasters(pending);
    this.events.emitOrderUpdate(pending);
    await this.audit.log(pending.id, actorId ?? clientId, OrderAuditAction.CREATED, {
      serviceType: pending.serviceType,
      city: pending.city,
      price: pending.price ? Number(pending.price) : null,
    });
    this.logger.log(`Order ${pending.id} created and broadcast to all masters`);

    return pending;
  }

  findForClient(clientId: string) {
    return this.prisma.serviceRequest.findMany({
      where: { clientId },
      include: this.orderIncludes(),
      orderBy: { createdAt: 'desc' },
    });
  }

  findForMaster(masterId: string) {
    return this.prisma.serviceRequest.findMany({
      where: {
        OR: [{ masterId }, { status: OrderStatus.PENDING, city: undefined }],
      },
      include: this.orderIncludes(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAvailableForMaster(masterId: string) {
    const profile = await this.prisma.masterProfile.findUnique({ where: { userId: masterId } });
    if (!profile) throw new NotFoundException('Master profile not found');

    return this.prisma.serviceRequest.findMany({
      where: {
        status: OrderStatus.PENDING,
        masterId: null,
        city: profile.serviceArea,
      },
      include: this.orderIncludes(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAssignedForMaster(masterId: string) {
    return this.prisma.serviceRequest.findMany({
      where: { masterId },
      include: this.orderIncludes(),
      orderBy: { updatedAt: 'desc' },
    });
  }

  findAll() {
    return this.prisma.serviceRequest.findMany({
      include: this.orderIncludes(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, role: Role) {
    const order = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: this.detailIncludes(),
    });
    if (!order) throw new NotFoundException('Order not found');

    if (role === Role.CLIENT && order.clientId !== userId) {
      throw new ForbiddenException();
    }
    if (role === Role.MASTER) {
      const profile = await this.prisma.masterProfile.findUnique({ where: { userId } });
      const isOwn = order.masterId === userId;
      const isPendingInArea =
        order.status === OrderStatus.PENDING &&
        !order.masterId &&
        profile != null &&
        order.city === profile.serviceArea;
      if (!isOwn && !isPendingInArea) throw new ForbiddenException();
    }

    return order;
  }

  async accept(orderId: string, masterId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.serviceRequest.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundException('Order not found');
      if (order.status !== OrderStatus.PENDING || order.masterId) {
        throw new BadRequestException('Order is no longer available');
      }

      const profile = await tx.masterProfile.findUnique({ where: { userId: masterId } });
      if (!profile) throw new BadRequestException('Master profile not found');
      if (profile.serviceArea !== order.city) {
        throw new BadRequestException('Order is in another city');
      }

      const workDay = startOfDay(order.preferredTime ?? new Date());
      const capacity = await this.mastersService.canAcceptForDay(masterId, workDay);
      if (!capacity.allowed) {
        throw new BadRequestException(
          `Daily limit reached (${capacity.limit} jobs). Reschedule or complete existing jobs.`,
        );
      }

      const scheduledAt = order.preferredTime ?? defaultScheduleTime(workDay, profile.workDayStart);

      return tx.serviceRequest.update({
        where: { id: orderId },
        data: { masterId, status: OrderStatus.ACCEPTED, scheduledAt },
        include: this.orderIncludes(),
      });
    });

    this.events.emitOrderAccepted(result);
    this.events.emitOrderUpdate(result);
    await this.audit.log(orderId, masterId, OrderAuditAction.ASSIGNED, { masterId });
    this.logger.log(`Order ${orderId} accepted by master ${masterId}`);
    return result;
  }

  async adminUpdate(orderId: string, adminId: string, dto: AdminUpdateOrderDto) {
    const order = await this.prisma.serviceRequest.findUnique({
      where: { id: orderId },
      include: { settlement: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    const data: {
      address?: string;
      price?: number;
      status?: OrderStatus;
    } = {};

    if (dto.address !== undefined && dto.address !== order.address) {
      changes.address = { from: order.address, to: dto.address };
      data.address = dto.address;
    }
    if (dto.price !== undefined && Number(order.price ?? 0) !== dto.price) {
      changes.price = { from: order.price ? Number(order.price) : null, to: dto.price };
      data.price = dto.price;
    }
    if (dto.status !== undefined && dto.status !== order.status) {
      changes.status = { from: order.status, to: dto.status };
      data.status = dto.status;
    }

    if (Object.keys(data).length === 0) {
      return this.prisma.serviceRequest.findUnique({
        where: { id: orderId },
        include: this.orderIncludes(),
      });
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id: orderId },
      data,
      include: this.orderIncludes(),
    });

    const action =
      dto.status !== undefined && dto.status !== order.status
        ? OrderAuditAction.STATUS_CHANGED
        : OrderAuditAction.UPDATED;

    await this.audit.log(orderId, adminId, action, { changes } as Prisma.InputJsonValue);
    this.events.emitOrderUpdate(updated);
    return updated;
  }

  async scheduleOrder(orderId: string, masterId: string, dto: ScheduleOrderDto) {
    const order = await this.prisma.serviceRequest.findUnique({ where: { id: orderId } });
    if (!order || order.masterId !== masterId) {
      throw new NotFoundException('Order not found');
    }
    if (
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.CANCELLED ||
      order.status === OrderStatus.PENDING
    ) {
      throw new BadRequestException('Cannot reschedule this order');
    }

    const newDate = new Date(dto.scheduledAt);
    const workDay = startOfDay(newDate);
    const countOnDay = await this.mastersService.countJobsForDay(masterId, workDay);
    const profile = await this.mastersService.getProfile(masterId);
    const sameDay = isSameDay(getOrderWorkDate(order), workDay);
    const effectiveCount = sameDay ? countOnDay - 1 : countOnDay;

    if (effectiveCount >= profile.maxJobsPerDay) {
      throw new BadRequestException(`Daily limit (${profile.maxJobsPerDay}) reached for this date`);
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id: orderId },
      data: { scheduledAt: newDate },
      include: this.orderIncludes(),
    });

    this.events.emitOrderUpdate(updated);
    return updated;
  }

  async updateMasterNotes(orderId: string, masterId: string, dto: UpdateMasterNotesDto) {
    const order = await this.prisma.serviceRequest.findUnique({ where: { id: orderId } });
    if (!order || order.masterId !== masterId) {
      throw new NotFoundException('Order not found');
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id: orderId },
      data: { masterNotes: dto.masterNotes },
      include: this.detailIncludes(),
    });
    this.events.emitOrderUpdate(updated);
    return updated;
  }

  async addComment(orderId: string, authorId: string, role: Role, dto: CreateOrderCommentDto) {
    const order = await this.findOne(orderId, authorId, role);

    const comment = await this.prisma.orderComment.create({
      data: { orderId, authorId, content: dto.content },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    this.events.emitOrderComment(orderId, comment);
    return comment;
  }

  async getComments(orderId: string, userId: string, role: Role) {
    await this.findOne(orderId, userId, role);
    return this.prisma.orderComment.findMany({
      where: { orderId },
      include: { author: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async decline(_orderId: string, _masterId: string) {
    return { message: 'Declined' };
  }

  async updateStatus(orderId: string, userId: string, role: Role, dto: UpdateOrderStatusDto) {
    if (dto.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Use POST /orders/:id/complete with settlement data');
    }

    const order = await this.findOne(orderId, userId, role);
    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${dto.status}`);
    }

    if (role === Role.MASTER && order.masterId !== userId) {
      throw new ForbiddenException();
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        ...(dto.price !== undefined ? { price: dto.price } : {}),
      },
      include: this.orderIncludes(),
    });

    await this.audit.log(orderId, userId, OrderAuditAction.STATUS_CHANGED, {
      from: order.status,
      to: dto.status,
      ...(dto.price !== undefined ? { price: dto.price } : {}),
    });
    this.events.emitOrderUpdate(updated);
    return updated;
  }

  async completeOrder(orderId: string, masterId: string, dto: CompleteOrderDto) {
    const order = await this.prisma.serviceRequest.findUnique({
      where: { id: orderId },
      include: { settlement: true },
    });
    if (!order || order.masterId !== masterId) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== OrderStatus.IN_PROGRESS) {
      throw new BadRequestException('Order must be in progress to complete');
    }
    if (order.settlement) {
      throw new BadRequestException('Order already settled');
    }

    const materials = (dto.materials ?? []).map((m) => ({
      name: m.name.trim(),
      quantity: m.quantity,
      unitPrice: m.unitPrice,
    }));

    const totals = calculateSettlementTotals({
      clientPaid: dto.clientPaid,
      transportCost: dto.transportCost,
      otherCosts: dto.otherCosts,
      materials,
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      const settlement = await tx.orderSettlement.create({
        data: {
          orderId,
          clientPaid: dto.clientPaid,
          transportCost: totals.transportCost,
          otherCosts: totals.otherCosts,
          materialsCost: totals.materialsCost,
          totalExpenses: totals.totalExpenses,
          netProfit: totals.netProfit,
          notes: dto.notes?.trim() || null,
          expenseItems: {
            create: materials.map((m) => ({
              name: m.name,
              quantity: m.quantity,
              unitPrice: m.unitPrice,
              totalPrice: roundMoney(m.quantity * m.unitPrice),
              category: 'MATERIAL',
            })),
          },
        },
        include: { expenseItems: true },
      });

      const result = await tx.serviceRequest.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.COMPLETED,
          price: dto.clientPaid,
        },
        include: this.detailIncludes(),
      });

      await tx.masterProfile.update({
        where: { userId: masterId },
        data: { totalEarnings: { increment: totals.netProfit } },
      });

      return { ...result, settlement };
    });

    await this.audit.log(orderId, masterId, OrderAuditAction.STATUS_CHANGED, {
      from: OrderStatus.IN_PROGRESS,
      to: OrderStatus.COMPLETED,
      netProfit: totals.netProfit,
    });
    this.events.emitOrderUpdate(updated);
    this.logger.log(`Order ${orderId} completed. Net profit: ${totals.netProfit}`);
    return updated;
  }

  async assignManually(orderId: string, masterId: string) {
    const master = await this.prisma.user.findUnique({
      where: { id: masterId },
      include: { masterProfile: true },
    });
    if (!master || master.role !== Role.MASTER) {
      throw new BadRequestException('Invalid master');
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id: orderId },
      data: { masterId, status: OrderStatus.ACCEPTED },
      include: this.orderIncludes(),
    });

    this.events.emitOrderAccepted(updated);
    this.events.emitOrderUpdate(updated);
    return updated;
  }

  private orderIncludes() {
    return {
      client: { select: userContactSelect },
      master: {
        select: {
          ...userContactSelect,
          masterProfile: { select: masterProfilePublicSelect },
        },
      },
      settlement: {
        include: { expenseItems: { orderBy: { createdAt: 'asc' as const } } },
      },
    };
  }

  private detailIncludes() {
    return {
      ...this.orderIncludes(),
      comments: {
        include: { author: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' as const },
      },
    };
  }
}
