import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'youtube-download' }),
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
