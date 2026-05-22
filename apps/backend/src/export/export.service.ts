import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ExportService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    @InjectQueue('video-export') private exportQueue: Queue,
  ) {}

  async triggerExport(
    userId: string,
    editId: string,
    format: { aspectRatio: string; resolution: string; quality: string },
  ) {
    const edit = await this.prisma.edit.findFirst({
      where: { id: editId, userId },
    });

    if (!edit) throw new NotFoundException('Edit not found');

    const existing = await this.prisma.exportJob.findFirst({
      where: { editId, status: { in: ['QUEUED', 'PROCESSING'] } },
    });

    if (existing) {
      return this.getStatus(userId, existing.id);
    }

    const exportJob = await this.prisma.exportJob.create({
      data: {
        editId,
        userId,
        format: format.aspectRatio,
        resolution: format.resolution,
        quality: format.quality,
        status: 'QUEUED',
        progress: 0,
      },
    });

    await this.exportQueue.add('process', {
      editId,
      aspectRatio: format.aspectRatio,
      resolution: format.resolution,
      quality: format.quality,
    }, {
      jobId: `export_${exportJob.id}`,
    });

    return { id: exportJob.id, status: 'QUEUED', progress: 0 };
  }

  async getStatus(userId: string, jobId: string) {
    const job = await this.prisma.exportJob.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) throw new NotFoundException('Export job not found');

    let downloadUrl: string | null = null;
    if (job.r2Key && job.status === 'COMPLETED') {
      try {
        downloadUrl = await this.storage.getSignedUrl(job.r2Key, 7200);
      } catch {}
    }

    return { ...job, downloadUrl };
  }

  async listExports(userId: string) {
    return this.prisma.exportJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
