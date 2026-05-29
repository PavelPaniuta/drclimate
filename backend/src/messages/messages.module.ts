import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { OrderChatController } from './order-chat.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [MessagesController, OrderChatController],
  providers: [MessagesService],
})
export class MessagesModule {}
