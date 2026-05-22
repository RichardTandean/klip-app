import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

const execFileAsync = promisify(execFile);

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
  words: { text: string; start: number; end: number; confidence: number }[];
}

@Injectable()
@Processor('video-transcribe')
export class TranscriptProcessor extends WorkerHost {
  private readonly logger = new Logger(TranscriptProcessor.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.assemblyai.com/v2';

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    @InjectQueue('clip-analysis') private clipAnalysisQueue: Queue,
  ) {
    super();
    this.apiKey = process.env.ASSEMBLYAI_API_KEY || '';
  }

  async process(job: Job<{ projectId: string; videoId: string; r2Url: string; r2Key: string }>): Promise<any> {
    const { projectId, videoId, r2Key } = job.data;

    this.logger.log(`Starting transcription for video ${videoId}`);

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'TRANSCRIBING' },
    });

    const signedUrl = await this.storage.getSignedUrl(r2Key, 7200);

    this.logger.log(`Signed URL ready, submitting to AssemblyAI`);

    const transcriptId = await this.submitTranscription(signedUrl);
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

    const segments = this.buildSegments(transcript.id, result);

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

  private async extractAndUploadAudio(videoId: string, signedVideoUrl: string): Promise<string> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'klip_audio_'));
    const audioFile = path.join(tmpDir, `${videoId}.mp3`);

    try {
      this.logger.log(`Extracting audio from video ${videoId}`);

      await execFileAsync('ffmpeg', [
        '-y',
        '-i', signedVideoUrl,
        '-vn',
        '-acodec', 'libmp3lame',
        '-ar', '44100',
        '-ac', '2',
        '-b:a', '128k',
        audioFile,
      ], { timeout: 300000 });

      this.logger.log(`Audio extracted, uploading to R2`);

      const audioKey = this.storage.generateKey('audio', `${videoId}.mp3`);
      const audioBuffer = await fs.readFile(audioFile);
      await this.storage.upload(audioFile, audioKey, 'audio/mpeg');

      const signedAudioUrl = await this.storage.getSignedUrl(audioKey, 7200);

      this.logger.log(`Audio uploaded, signed URL ready`);

      return signedAudioUrl;
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
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

  private buildSegments(transcriptId: string, result: AssemblyAIResult) {
    if (result.utterances && result.utterances.length > 0) {
      return result.utterances.map((u, index) => ({
        transcriptId,
        index,
        text: u.text.trim(),
        startMs: Math.round(u.start),
        endMs: Math.round(u.end),
      }));
    }

    if (result.words && result.words.length > 0) {
      return this.buildSentenceSegments(transcriptId, result.words);
    }

    return [];
  }

  private buildSentenceSegments(
    transcriptId: string,
    words: { text: string; start: number; end: number; confidence: number }[],
  ) {
    const fullText = words.map((w) => w.text).join(' ');
    const sentenceBoundaries = this.findSentenceBoundaries(fullText);

    if (sentenceBoundaries.length === 0) {
      return this.buildChunkSegments(transcriptId, words, 30);
    }

    const segments: { transcriptId: string; index: number; text: string; startMs: number; endMs: number }[] = [];

    let wordCursor = 0;
    for (const sentence of sentenceBoundaries) {
      const sentenceWords: typeof words = [];
      let charPos = 0;

      for (let i = wordCursor; i < words.length; i++) {
        const w = words[i];
        const expectedText = sentence.slice(charPos).trimStart();

        if (expectedText.startsWith(w.text)) {
          sentenceWords.push(w);
          charPos = sentence.indexOf(w.text, charPos) + w.text.length;
          wordCursor = i + 1;
        }
      }

      if (sentenceWords.length > 0) {
        segments.push({
          transcriptId,
          index: segments.length,
          text: sentenceWords.map((w) => w.text).join(' '),
          startMs: Math.round(sentenceWords[0].start),
          endMs: Math.round(sentenceWords[sentenceWords.length - 1].end),
        });
      }
    }

    if (segments.length === 0) {
      return this.buildChunkSegments(transcriptId, words, 30);
    }

    return segments;
  }

  private findSentenceBoundaries(text: string): string[] {
    const sentences: string[] = [];
    let current = '';
    let i = 0;

    while (i < text.length) {
      const ch = text[i];

      if ((ch === '.' || ch === '?' || ch === '!') && (i + 1 >= text.length || text[i + 1] === ' ' || text[i + 1] === '\n')) {
        current += ch;
        const trimmed = current.trim();
        if (trimmed.length > 0) {
          sentences.push(trimmed);
        }
        current = '';
        i += 2;
        continue;
      }

      current += ch;
      i++;
    }

    const trimmed = current.trim();
    if (trimmed.length > 0) {
      sentences.push(trimmed);
    }

    return sentences;
  }

  private buildChunkSegments(
    transcriptId: string,
    words: { text: string; start: number; end: number; confidence: number }[],
    wordsPerChunk: number,
  ) {
    const segments: { transcriptId: string; index: number; text: string; startMs: number; endMs: number }[] = [];
    for (let i = 0; i < words.length; i += wordsPerChunk) {
      const chunk = words.slice(i, i + wordsPerChunk);
      segments.push({
        transcriptId,
        index: segments.length,
        text: chunk.map((w) => w.text).join(' ').trim(),
        startMs: Math.round(chunk[0].start),
        endMs: Math.round(chunk[chunk.length - 1].end),
      });
    }
    return segments;
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
