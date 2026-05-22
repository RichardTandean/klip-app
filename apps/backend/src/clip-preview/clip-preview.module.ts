import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ClipPreviewProcessor } from './clip-preview.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'clip-preview' })],
  providers: [ClipPreviewProcessor],
})
export class ClipPreviewModule {}
