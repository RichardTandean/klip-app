import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import { StorageService } from '../storage/storage.service';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

const execFileAsync = promisify(execFile);

@Injectable()
@Processor('clip-analysis')
export class ClipProcessor extends WorkerHost {
  private readonly logger = new Logger(ClipProcessor.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AIService,
    private storage: StorageService,
  ) {
    super();
  }

  async process(job: Job<{ projectId: string }>): Promise<any> {
    const { projectId } = job.data;

    this.logger.log(`Starting clip analysis for project ${projectId}`);

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'ANALYZING' },
    });

    const transcript = await this.prisma.transcript.findFirst({
      where: { video: { projectId } },
      include: { segments: { orderBy: { index: 'asc' } } },
    });

    if (!transcript || transcript.segments.length === 0) {
      await this.prisma.project.update({
        where: { id: projectId },
        data: { status: 'FAILED' },
      });
      throw new Error('No transcript found for analysis');
    }

    const segments = transcript.segments.map((s) => ({
      index: s.index,
      text: s.text,
      startMs: s.startMs,
      endMs: s.endMs,
    }));

    const result = await this.aiService.analyzeTranscript(projectId, segments);

    if (result.clips.length === 0) {
      await this.prisma.project.update({
        where: { id: projectId },
        data: { status: 'READY' },
      });
      return { status: 'no_clips_found' };
    }

    await this.prisma.clip.createMany({
      data: result.clips.map((c) => ({
        projectId,
        title: c.title,
        startSegmentIndex: c.startSentenceIndex,
        endSegmentIndex: c.endSentenceIndex,
        startMs: c.startMs,
        endMs: c.endMs,
        durationMs: c.durationMs,
        reasoning: c.reasoning,
        viralScore: c.viralScore,
        status: 'CLIPPING',
      })),
    });

    const createdClips = await this.prisma.clip.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: result.clips.length,
    });

    const sourceVideo = await this.prisma.video.findFirst({
      where: { projectId },
    });

    if (!sourceVideo?.r2Key) {
      await this.prisma.project.update({
        where: { id: projectId },
        data: { status: 'FAILED' },
      });
      throw new Error('Source video not found for clipping');
    }

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'CLIPPING' },
    });

    let trimmedCount = 0;
    for (const clip of createdClips) {
      try {
        await this.trimClip(clip.id, clip.startMs, clip.endMs, sourceVideo.r2Key);
        await this.prisma.clip.update({
          where: { id: clip.id },
          data: { status: 'READY' },
        });
        trimmedCount++;
        this.logger.log(`Clipped ${clip.id}: ${clip.startMs}ms → ${clip.endMs}ms (${trimmedCount}/${createdClips.length})`);
      } catch (err: any) {
        this.logger.error(`Failed to clip ${clip.id}: ${err?.message}`);
        await this.prisma.clip.update({
          where: { id: clip.id },
          data: { status: 'FAILED' },
        });
      }
    }

    this.logger.log(`Clipping complete: ${trimmedCount}/${createdClips.length} clips`);

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'READY' },
    });

    return {
      status: 'clipped',
      clipCount: result.clips.length,
      trimmedCount,
    };
  }

  private async trimClip(clipId: string, startMs: number, endMs: number, sourceKey: string) {
    const previewKey = `previews/${clipId}.mp4`;

    const signedUrl = await this.storage.getSignedUrl(sourceKey, 7200);

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'klip_clip_'));
    const outputFile = path.join(tmpDir, 'trimmed.mp4');

    try {
      await execFileAsync('ffmpeg', [
        '-y',
        '-ss', formatTimecode(startMs),
        '-to', formatTimecode(endMs),
        '-i', signedUrl,
        '-c', 'copy',
        '-avoid_negative_ts', 'make_zero',
        outputFile,
      ], { timeout: 120000 });

      const buffer = await fs.readFile(outputFile);
      await this.storage.uploadBuffer(buffer, previewKey, 'video/mp4');
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Clip analysis complete: ${job.data.projectId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Clip analysis failed: ${job.data.projectId}`, error.message);
  }
}

function formatTimecode(ms: number): string {
  const totalSeconds = ms / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toFixed(3).padStart(6, '0')}`;
}
