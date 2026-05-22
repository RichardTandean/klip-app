import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

const execFileAsync = promisify(execFile);

@Injectable()
export class ClipService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    @InjectQueue('clip-analysis') private clipAnalysisQueue: Queue,
  ) {}

  async findAll(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.clip.findMany({
      where: { projectId },
      orderBy: { viralScore: 'desc' },
    });
  }

  async triggerAnalysis(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.status !== 'READY') {
      throw new Error(
        `Project not ready for analysis. Current status: ${project.status}`,
      );
    }

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'PENDING' },
    });

    await this.clipAnalysisQueue.add('analyze', { projectId }, {
      jobId: `clip_analysis_${projectId}`,
    });

    return { status: 'analysis_started', projectId };
  }

  async getPreview(userId: string, projectId: string, clipId: string) {
    const clip = await this.prisma.clip.findFirst({
      where: { id: clipId, projectId },
      include: {
        project: {
          include: { videos: { take: 1 } },
        },
      },
    });

    if (!clip || clip.project.userId !== userId) {
      throw new NotFoundException('Clip not found');
    }

    const video = clip.project.videos[0];
    if (!video?.r2Key) {
      throw new NotFoundException('Source video not found');
    }

    const previewKey = `previews/${clip.id}.mp4`;

    try {
      const previewUrl = await this.storage.getSignedUrl(previewKey, 3600);
      return { previewUrl, durationMs: clip.durationMs, clipTitle: clip.title };
    } catch {}

    const signedUrl = await this.storage.getSignedUrl(video.r2Key, 7200);
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'klip_preview_'));
    const outputFile = path.join(tmpDir, `${clip.id}.mp4`);

    try {
      await execFileAsync('ffmpeg', [
        '-y',
        '-ss', formatTimecode(clip.startMs),
        '-to', formatTimecode(clip.endMs),
        '-i', signedUrl,
        '-c', 'copy',
        '-avoid_negative_ts', 'make_zero',
        outputFile,
      ], { timeout: 120000 });

      await this.storage.upload(outputFile, previewKey, 'video/mp4');
      const previewUrl = await this.storage.getSignedUrl(previewKey, 7200);

      return { previewUrl, durationMs: clip.durationMs, clipTitle: clip.title };
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

function formatTimecode(ms: number): string {
  const totalSeconds = ms / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toFixed(3).padStart(6, '0')}`;
}
