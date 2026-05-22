import { Injectable, Logger } from '@nestjs/common';

export interface ClipSegment {
  index: number;
  text: string;
  startMs: number;
  endMs: number;
}

export interface ClipRecommendation {
  title: string;
  startSentenceIndex: number;
  endSentenceIndex: number;
  startMs: number;
  endMs: number;
  durationMs: number;
  reasoning: string;
  viralScore: number;
  platform?: string;
  caption?: string;
}

export interface AnalysisResult {
  projectId: string;
  status: string;
  clips: ClipRecommendation[];
  segmentCount: number;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly agentUrl: string;

  constructor() {
    this.agentUrl = process.env.AGENT_URL || 'http://localhost:8001';
  }

  async analyzeTranscript(
    projectId: string,
    segments: ClipSegment[],
  ): Promise<AnalysisResult> {
    this.logger.log(`Analyzing ${segments.length} segments for project ${projectId}`);

    const res = await fetch(`${this.agentUrl}/api/agent/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        segments: segments.map((s) => ({
          index: s.index,
          text: s.text,
          start_ms: s.startMs,
          end_ms: s.endMs,
        })),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AI analysis failed: ${err}`);
    }

    const data = (await res.json()) as any;

    return {
      projectId: data.project_id,
      status: data.status,
      clips: data.clips.map((c: any) => ({
        title: c.title,
        startSentenceIndex: c.start_sentence_index,
        endSentenceIndex: c.end_sentence_index,
        startMs: c.start_ms,
        endMs: c.end_ms,
        durationMs: c.duration_ms,
        reasoning: c.reasoning,
        viralScore: c.viral_score,
        platform: c.platform,
        caption: c.caption,
      })),
      segmentCount: data.segment_count,
    };
  }

  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${this.agentUrl}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }
}
