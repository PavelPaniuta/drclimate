import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderAuditService } from './order-audit.service';
import { OrdersController } from './orders.controller';
import { MatchingModule } from '../matching/matching.module';
import { EventsModule } from '../events/events.module';
import { MastersModule } from '../masters/masters.module';
import { CitiesModule } from '../cities/cities.module';

@Module({
  imports: [MatchingModule, forwardRef(() => EventsModule), MastersModule, CitiesModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderAuditService],
  exports: [OrdersService, OrderAuditService],
})
export class OrdersModule {}
