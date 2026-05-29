import { Module } from '@nestjs/common';
import { MasterChatService } from './master-chat.service';
import { MasterChatController } from './master-chat.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [MasterChatController],
  providers: [MasterChatService],
  exports: [MasterChatService],
})
export class MasterChatModule {}
