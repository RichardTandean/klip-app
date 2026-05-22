import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ClipController } from './clip.controller';
import { ClipService } from './clip.service';
import { ClipProcessor } from './clip.processor';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'clip-analysis' }),
    AIModule,
  ],
  controllers: [ClipController],
  providers: [ClipService, ClipProcessor],
})
export class ClipModule {}
