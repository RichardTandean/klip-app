import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';

@Injectable()
@Processor('clip-analysis')
export class ClipProcessor extends WorkerHost {
  private readonly logger = new Logger(ClipProcessor.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AIService,
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
      where: {
        video: { projectId },
      },
      include: {
        segments: { orderBy: { index: 'asc' } },
      },
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
        status: 'READY',
      })),
    });

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'READY' },
    });

    return {
      status: 'analyzed',
      clipCount: result.clips.length,
    };
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
