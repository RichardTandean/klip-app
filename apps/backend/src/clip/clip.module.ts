import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ClipController } from './clip.controller';
import { ClipService } from './clip.service';
import { ClipProcessor } from './clip.processor';
import { AIModule } from '../ai/ai.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'clip-analysis' }),
    StorageModule,
    AIModule,
  ],
  controllers: [ClipController],
  providers: [ClipService, ClipProcessor],
})
export class ClipModule {}
