import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MastersModule } from './masters/masters.module';
import { OrdersModule } from './orders/orders.module';
import { MessagesModule } from './messages/messages.module';
import { AdminModule } from './admin/admin.module';
import { MatchingModule } from './matching/matching.module';
import { EventsModule } from './events/events.module';
import { CitiesModule } from './cities/cities.module';
import { MasterChatModule } from './master-chat/master-chat.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UploadsModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    MastersModule,
    OrdersModule,
    MessagesModule,
    AdminModule,
    MatchingModule,
    EventsModule,
    CitiesModule,
    MasterChatModule,
  ],
})
export class AppModule {}
