import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

interface AssemblyAIUtterance {
  confidence: number;
  end: number;
  start: number;
  text: string;
  words: { text: string; start: number; end: number; confidence: number }[];
}

interface AssemblyAIResult {
  id: string;
  status: string;
  text: string;
  utterances: AssemblyAIUtterance[];
}

@Injectable()
@Processor('video-transcribe')
export class TranscriptProcessor extends WorkerHost {
  private readonly logger = new Logger(TranscriptProcessor.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.assemblyai.com/v2';

  constructor(
    private prisma: PrismaService,
    @InjectQueue('clip-analysis') private clipAnalysisQueue: Queue,
  ) {
    super();
    this.apiKey = process.env.ASSEMBLYAI_API_KEY || '';
  }

  async process(job: Job<{ projectId: string; videoId: string; r2Url: string }>): Promise<any> {
    const { projectId, videoId, r2Url } = job.data;

    this.logger.log(`Starting transcription for video ${videoId}`);

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'TRANSCRIBING' },
    });

    const transcriptId = await this.submitTranscription(r2Url);
    const result = await this.pollTranscription(transcriptId);

    if (result.status !== 'completed') {
      throw new Error(`Transcription failed: ${result.status}`);
    }

    const transcript = await this.prisma.transcript.create({
      data: {
        videoId,
        fullText: result.text,
        rawJson: result as any,
      },
    });

    const segments = (result.utterances || []).map((u, index) => ({
      transcriptId: transcript.id,
      index,
      text: u.text.trim(),
      startMs: Math.round(u.start),
      endMs: Math.round(u.end),
    }));

    if (segments.length > 0) {
      await this.prisma.transcriptSegment.createMany({ data: segments });
    }

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'PENDING' },
    });

    await this.clipAnalysisQueue.add('analyze', { projectId }, {
      jobId: `clip_analysis_${projectId}`,
    });

    return {
      status: 'transcribed',
      transcriptId: transcript.id,
      segmentCount: segments.length,
    };
  }

  private async submitTranscription(audioUrl: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/transcript`, {
      method: 'POST',
      headers: {
        authorization: this.apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_detection: true,
        punctuate: true,
        format_text: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AssemblyAI submit failed: ${err}`);
    }

    const data = await res.json() as { id: string };
    return data.id;
  }

  private async pollTranscription(
    transcriptId: string,
    maxAttempts = 120,
  ): Promise<AssemblyAIResult> {
    for (let i = 0; i < maxAttempts; i++) {
      await this.delay(2000);

      const res = await fetch(`${this.baseUrl}/transcript/${transcriptId}`, {
        headers: { authorization: this.apiKey },
      });

      if (!res.ok) continue;

      const result = (await res.json()) as AssemblyAIResult;

      if (result.status === 'completed' || result.status === 'error') {
        return result;
      }

      this.logger.log(`Transcription status: ${result.status} (attempt ${i + 1})`);
    }

    throw new Error('Transcription polling timeout');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Transcription complete: ${job.data.projectId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Transcription failed: ${job.data.projectId}`, error.message);
  }
}
