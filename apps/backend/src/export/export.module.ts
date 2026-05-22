import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ExportProcessor } from './export.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'video-export' }),
  ],
  controllers: [ExportController],
  providers: [ExportService, ExportProcessor],
})
export class ExportModule {}
