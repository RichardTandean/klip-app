import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { QueueModule } from './queue/queue.module';
import { StorageModule } from './storage/storage.module';
import { VideoModule } from './video/video.module';
import { TranscriptModule } from './transcript/transcript.module';
import { ProjectModule } from './project/project.module';
import { WebSocketModule } from './websocket/websocket.module';
import { AIModule } from './ai/ai.module';
import { ClipModule } from './clip/clip.module';
import { EditModule } from './edit/edit.module';
import { MotionModule } from './motion/motion.module';
import { ExportModule } from './export/export.module';
import { ClipPreviewModule } from './clip-preview/clip-preview.module';
import { StreamModule } from './stream/stream.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    AuthModule,
    QueueModule,
    StorageModule,
    VideoModule,
    TranscriptModule,
    ProjectModule,
    WebSocketModule,
    AIModule,
    ClipModule,
    EditModule,
    MotionModule,
    ExportModule,
    ClipPreviewModule,
    StreamModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
