'use client';

import Link from 'next/link';
import type { Clip } from '@/hooks/use-projects';

function formatDuration(ms: number) {
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function getScoreColor(score: number) {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-yellow-600';
  return 'text-red-600';
}

export function ClipCard({ clip, projectId }: { clip: Clip; projectId: string }) {
  return (
    <Link href={`/editor/${clip.id}?projectId=${projectId}`}>
      <div className="rounded-lg border p-4 transition-colors hover:bg-muted/50 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight">{clip.title}</h3>
          <span className={`text-sm font-bold shrink-0 ${getScoreColor(clip.viralScore)}`}>
            {clip.viralScore.toFixed(1)}
          </span>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">
          {clip.reasoning}
        </p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatDuration(clip.durationMs)}</span>
          <span>
            Sentences {clip.startSegmentIndex}–{clip.endSegmentIndex}
          </span>
        </div>

        <div className="w-full bg-muted rounded-full h-1.5">
          <div
            className="bg-primary h-1.5 rounded-full"
            style={{ width: `${Math.min(clip.viralScore * 10, 100)}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
