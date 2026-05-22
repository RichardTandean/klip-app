import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as os from 'os';
import { promises as fs } from 'fs';
import { InjectQueue, Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

const execFileAsync = promisify(execFile);

@Injectable()
@Processor('youtube-download')
export class VideoProcessor extends WorkerHost {
  private readonly logger = new Logger(VideoProcessor.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    @InjectQueue('video-transcribe') private transcribeQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<{ projectId: string; youtubeUrl: string }>): Promise<any> {
    const { projectId, youtubeUrl } = job.data;

    this.logger.log(`Downloading: ${youtubeUrl}`);

    const existing = await this.prisma.video.findFirst({
      where: { youtubeUrl },
    });

    if (existing) {
      await this.prisma.project.update({
        where: { id: projectId },
        data: { status: 'TRANSCRIBING' },
      });

      await this.transcribeQueue.add('transcribe', {
        projectId,
        videoId: existing.id,
        r2Url: existing.r2Url,
        r2Key: existing.r2Key,
      });

      return { status: 'deduplicated', videoId: existing.id };
    }

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'DOWNLOADING' },
    });

    const tmpDir = os.tmpdir();
    const videoId = extractVideoId(youtubeUrl);
    const outputFile = path.join(tmpDir, `klip_${projectId}_${videoId}.mp4`);

    try {
      await execFileAsync('yt-dlp', [
        '--no-playlist',
        '--format', 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
        '--merge-output-format', 'mp4',
        '--output', outputFile,
        youtubeUrl,
      ], { timeout: 600000 });

      const localFile = outputFile;

      const r2Key = this.storage.generateKey('videos', `${videoId}.mp4`);
      const r2Url = await this.storage.upload(localFile, r2Key, 'video/mp4');

      await fs.unlink(localFile);

      const video = await this.prisma.video.create({
        data: {
          projectId,
          youtubeUrl,
          r2Url,
          r2Key,
          durationMs: 0,
        },
      });

      await this.prisma.project.update({
        where: { id: projectId },
        data: { status: 'TRANSCRIBING' },
      });

      await this.transcribeQueue.add('transcribe', {
        projectId,
        videoId: video.id,
        r2Url,
        r2Key,
      });

      await this.prisma.video.update({
        where: { id: video.id },
        data: { r2Url, r2Key },
      });

      return { status: 'downloaded', videoId: video.id, r2Url };

    } catch (error) {
      this.logger.error(`Download failed: ${error}`);

      await this.prisma.project.update({
        where: { id: projectId },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Download completed: ${job.data.projectId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Download failed: ${job.data.projectId}`, error.message);
  }
}

function extractVideoId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return url.split('/').pop()?.split('?')[0] || String(Date.now());
}
