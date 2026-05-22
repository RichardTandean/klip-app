import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

const execFileAsync = promisify(execFile);

@Injectable()
@Processor('clip-preview')
export class ClipPreviewProcessor extends WorkerHost {
  private readonly logger = new Logger(ClipPreviewProcessor.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {
    super();
  }

  async process(job: Job<{ clipId: string }>): Promise<any> {
    const { clipId } = job.data;

    this.logger.log(`Generating preview for clip ${clipId}`);

    const clip = await this.prisma.clip.findUnique({
      where: { id: clipId },
      include: {
        project: {
          include: { videos: { take: 1 } },
        },
      },
    });

    if (!clip) {
      this.logger.warn(`Clip ${clipId} not found`);
      return { status: 'skipped' };
    }

    const video = clip.project.videos[0];
    if (!video?.r2Key) {
      this.logger.warn(`No source video for clip ${clipId}`);
      return { status: 'skipped' };
    }

    const previewKey = `previews/${clipId}.mp4`;

    const existing = await this.storage.getSignedUrl(previewKey, 60).catch(() => null);
    if (existing) {
      this.logger.log(`Preview already exists for clip ${clipId}`);
      return { status: 'already_exists' };
    }

    const signedUrl = await this.storage.getSignedUrl(video.r2Key, 7200);
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'klip_preview_'));
    const outputFile = path.join(tmpDir, `${clipId}.mp4`);

    try {
      this.logger.log(`Trimming clip ${clipId}: ${clip.startMs}ms → ${clip.endMs}ms`);

      await execFileAsync('ffmpeg', [
        '-y',
        '-ss', formatTimecode(clip.startMs),
        '-to', formatTimecode(clip.endMs),
        '-i', signedUrl,
        '-c', 'copy',
        '-avoid_negative_ts', 'make_zero',
        outputFile,
      ], { timeout: 120000 });

      const stat = await fs.stat(outputFile);
      this.logger.log(`Preview rendered: ${(stat.size / 1024).toFixed(1)}KB`);

      await this.storage.upload(outputFile, previewKey, 'video/mp4');
      this.logger.log(`Preview uploaded to R2: ${previewKey}`);

      return { status: 'completed', previewKey };
    } catch (error) {
      this.logger.error(`Preview generation failed for clip ${clipId}: ${error}`);
      throw error;
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Preview complete: ${job.data.clipId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Preview failed: ${job.data.clipId}`, error.message);
  }
}

function formatTimecode(ms: number): string {
  const totalSeconds = ms / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toFixed(3).padStart(6, '0')}`;
}
