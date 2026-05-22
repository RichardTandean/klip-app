import { Module } from '@nestjs/common';
import { TranscriptProcessor } from './transcript.processor';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  providers: [TranscriptProcessor],
})
export class TranscriptModule {}