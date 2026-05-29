import { Module, forwardRef } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [forwardRef(() => EventsModule)],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
