import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { age: 3600 * 24 },
        removeOnFail: { age: 3600 * 24 * 3 },
      },
    }),
    BullModule.registerQueue(
      { name: 'youtube-download' },
      { name: 'video-transcribe' },
      { name: 'clip-analysis' },
      { name: 'clip-preview' },
      { name: 'motion-generate' },
      { name: 'video-export' },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
