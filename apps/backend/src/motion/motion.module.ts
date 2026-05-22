import { Module } from '@nestjs/common';
import { MotionController } from './motion.controller';
import { MotionService } from './motion.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [MotionController],
  providers: [MotionService],
})
export class MotionModule {}
