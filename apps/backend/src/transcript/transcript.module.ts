import { Module } from '@nestjs/common';
import { TranscriptProcessor } from './transcript.processor';

@Module({
  providers: [TranscriptProcessor],
})
export class TranscriptModule {}
