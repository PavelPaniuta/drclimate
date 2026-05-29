import { Injectable, Logger } from '@nestjs/common';
import { ServiceRequest } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async broadcastToMasters(order: ServiceRequest) {
    const masters = await this.prisma.masterProfile.findMany({
      where: {
        serviceArea: order.city,
        user: { isBanned: false },
      },
      include: { user: { select: { id: true, name: true } } },
    });

    this.logger.log(
      `Broadcasting order ${order.id} to ${masters.length} masters in ${order.city}`,
    );

    for (const master of masters) {
      this.events.emitNewOrderToMaster(master.userId, order);
    }
  }
}
