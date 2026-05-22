import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { promises as fs } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as os from 'os';

const execFileAsync = promisify(execFile);

interface ExportJobData {
  editId: string;
  aspectRatio: string;
  resolution: string;
  quality: string;
}

@Injectable()
@Processor('video-export')
export class ExportProcessor extends WorkerHost {
  private readonly logger = new Logger(ExportProcessor.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {
    super();
  }

  async process(job: Job<ExportJobData>): Promise<any> {
    const { editId, aspectRatio, resolution } = job.data;

    this.logger.log(`Starting export for edit ${editId}`);

    await this.updateProgress(job, 0);
    await this.prisma.exportJob.updateMany({
      where: { editId, status: 'QUEUED' },
      data: { status: 'PROCESSING', progress: 0 },
    });

    const edit = await this.prisma.edit.findFirst({
      where: { id: editId },
      include: {
        segments: { orderBy: { segmentIndex: 'asc' } },
        clip: {
          include: {
            project: {
              include: {
                videos: { take: 1 },
              },
            },
          },
        },
      },
    });

    if (!edit) throw new Error('Edit not found');

    const video = edit.clip.project.videos[0];
    if (!video) throw new Error('Source video not found');

    const transcript = await this.prisma.transcript.findFirst({
      where: { video: { projectId: edit.projectId } },
      include: { segments: { orderBy: { index: 'asc' } } },
    });

    const relevantSegments = transcript?.segments.filter(
      (s) => s.index >= edit.clip.startSegmentIndex && s.index <= edit.clip.endSegmentIndex,
    ) || [];

    const signedUrl = await this.storage.getSignedUrl(video.r2Key, 3600);

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'klip_export_'));
    const segmentFiles: string[] = [];

    try {
      await this.updateProgress(job, 10);

      for (let i = 0; i < edit.segments.length; i++) {
        const seg = edit.segments[i];
        const ts = relevantSegments.find((s) => s.index === seg.segmentIndex);
        if (!ts) continue;

        const segFile = path.join(tmpDir, `seg_${i.toString().padStart(3, '0')}.mp4`);
        const segStart = formatTimecode(ts.startMs);
        const segEnd = formatTimecode(ts.endMs);

        if (seg.type === 'original') {
          await execFileAsync('ffmpeg', [
            '-y',
            '-ss', segStart,
            '-to', segEnd,
            '-i', signedUrl,
            '-c', 'copy',
            '-avoid_negative_ts', 'make_zero',
            segFile,
          ], { timeout: 60000 });
        } else if (seg.brollUrl) {
          await this.createBrollSegment(seg.type, signedUrl, seg.brollUrl, segStart, segEnd, segFile);
        } else {
          await execFileAsync('ffmpeg', [
            '-y',
            '-ss', segStart,
            '-to', segEnd,
            '-i', signedUrl,
            '-c', 'copy',
            '-avoid_negative_ts', 'make_zero',
            segFile,
          ], { timeout: 60000 });
        }

        segmentFiles.push(segFile);
        await this.updateProgress(job, 10 + Math.floor((i / edit.segments.length) * 40));
      }

      await this.updateProgress(job, 50);

      const concatFile = path.join(tmpDir, 'concat.txt');
      const concatContent = segmentFiles.map((f) => `file '${f}'`).join('\n');
      await fs.writeFile(concatFile, concatContent);

      const concatOutput = path.join(tmpDir, 'concat_output.mp4');
      await execFileAsync('ffmpeg', [
        '-y', '-f', 'concat', '-safe', '0',
        '-i', concatFile,
        '-c', 'copy',
        concatOutput,
      ], { timeout: 120000 });

      await this.updateProgress(job, 60);

      const vttPath = path.join(tmpDir, 'subtitles.vtt');
      await this.generateVTT(relevantSegments, edit.clip.startMs, vttPath);

      const subbedOutput = path.join(tmpDir, 'subbed_output.mp4');
      await execFileAsync('ffmpeg', [
        '-y',
        '-i', concatOutput,
        '-vf', this.getSubtitleFilter(vttPath),
        '-c:a', 'copy',
        subbedOutput,
      ], { timeout: 120000 });

      await this.updateProgress(job, 75);

      const finalOutput = path.join(tmpDir, 'final.mp4');
      await this.resizeVideo(subbedOutput, finalOutput, aspectRatio, resolution);

      await this.updateProgress(job, 85);

      const r2Key = this.storage.generateKey('exports', `export_${editId}.mp4`);
      const r2Url = await this.storage.upload(finalOutput, r2Key, 'video/mp4');

      await this.prisma.exportJob.updateMany({
        where: { editId, status: 'PROCESSING' },
        data: {
          status: 'COMPLETED',
          progress: 100,
          r2Url,
          r2Key,
          completedAt: new Date(),
        },
      });

      await this.updateProgress(job, 100);

      return { status: 'completed', r2Url };
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  private async createBrollSegment(
    type: string,
    sourceUrl: string,
    brollUrl: string,
    start: string,
    end: string,
    output: string,
  ) {
    await execFileAsync('ffmpeg', [
      '-y',
      '-ss', start,
      '-to', end,
      '-i', sourceUrl,
      '-ss', start,
      '-to', end,
      '-i', brollUrl,
      '-filter_complex',
      '[1:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2[v1];[0:v][v1]overlay=0:0',
      '-c:a', 'copy',
      '-map', '0:a',
      output,
    ], { timeout: 120000 });
  }

  private async generateVTT(
    segments: { index: number; text: string; startMs: number; endMs: number }[],
    offsetMs: number,
    filePath: string,
  ) {
    let vtt = 'WEBVTT\n\n';

    for (const seg of segments) {
      const start = seg.startMs - offsetMs;
      const end = seg.endMs - offsetMs;
      vtt += `${msToVTT(start)} --> ${msToVTT(end)}\n`;
      vtt += `${seg.text}\n\n`;
    }

    await fs.writeFile(filePath, vtt);
  }

  private getSubtitleFilter(vttPath: string): string {
    const escaped = vttPath.replace(/:/g, '\\:').replace(/'/g, "\\'");
    return `subtitles='${escaped}':force_style='FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,BorderStyle=1'`;
  }

  private async resizeVideo(
    input: string,
    output: string,
    aspectRatio: string,
    resolution: string,
  ) {
    const targetH = resolution === '1080p' ? 1080 : 720;

    switch (aspectRatio) {
      case '9:16':
        const w916 = Math.floor(targetH * 9 / 16);
        await execFileAsync('ffmpeg', [
          '-y', '-i', input,
          '-vf', `crop=${w916}:${targetH},scale=${w916}:${targetH}`,
          '-c:a', 'copy',
          output,
        ], { timeout: 120000 });
        break;
      case '1:1':
        await execFileAsync('ffmpeg', [
          '-y', '-i', input,
          '-vf', `crop=min(iw\\,ih):min(iw\\,ih),scale=${targetH}:${targetH}`,
          '-c:a', 'copy',
          output,
        ], { timeout: 120000 });
        break;
      case '16:9':
      default:
        const w169 = Math.floor(targetH * 16 / 9);
        await execFileAsync('ffmpeg', [
          '-y', '-i', input,
          '-vf', `scale=${w169}:${targetH}:force_original_aspect_ratio=decrease,pad=${w169}:${targetH}:(ow-iw)/2:(oh-ih)/2`,
          '-c:a', 'copy',
          output,
        ], { timeout: 120000 });
    }
  }

  private async updateProgress(job: Job, progress: number) {
    await job.updateProgress(progress);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Export completed: ${job.data.editId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Export failed: ${job.data.editId}`, error.message);
  }
}

function formatTimecode(ms: number): string {
  const totalSeconds = ms / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toFixed(3).padStart(6, '0')}`;
}

function msToVTT(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSeconds = ms / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const secInt = Math.floor(seconds);
  const millis = Math.floor((seconds - secInt) * 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secInt.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
}
