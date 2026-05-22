import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { VideoProcessor } from './video.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'video-transcribe' }),
  ],
  providers: [VideoProcessor],
})
export class VideoModule {}
