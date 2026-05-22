'use client';

import { useState } from 'react';
import { useEditorStore } from '@/stores/editor-store';

interface Segment {
  index: number;
  text: string;
  startMs: number;
  endMs: number;
  type: string;
  brollUrl?: string | null;
  brollPrompt?: string | null;
}

interface SegmentInspectorProps {
  segment: Segment | null;
  onApplyBroll: (index: number, type: string, url?: string, prompt?: string) => void;
  onGenerateBroll: (index: number, prompt: string) => void;
  onReset: (index: number) => void;
}

export function SegmentInspector({
  segment,
  onApplyBroll,
  onGenerateBroll,
  onReset,
}: SegmentInspectorProps) {
  const [brollUrl, setBrollUrl] = useState('');
  const [brollPrompt, setBrollPrompt] = useState('');
  const [tab, setTab] = useState<'upload' | 'generate'>('upload');

  if (!segment) {
    return (
      <div className="rounded-lg border p-6 min-h-[200px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Select a segment to edit</p>
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    original: 'Original',
    broll_upload: 'Uploaded B-roll',
    broll_generated: 'AI Generated B-roll',
  };

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Segment {segment.index + 1}</h3>
        {segment.type !== 'original' && (
          <button
            onClick={() => onReset(segment.index)}
            className="text-xs text-red-500 hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{segment.text}</p>

      <div className="text-xs text-muted-foreground space-x-4">
        <span>Start: {formatTime(segment.startMs)}</span>
        <span>End: {formatTime(segment.endMs)}</span>
        <span>Type: {typeLabels[segment.type] || segment.type}</span>
      </div>

      {segment.brollUrl && (
        <div className="text-xs text-muted-foreground truncate">
          B-roll: {segment.brollUrl}
        </div>
      )}

      <div className="border-t pt-4 space-y-3">
        <div className="flex gap-1 border-b">
          <button
            onClick={() => setTab('upload')}
            className={`text-xs px-3 py-1.5 -mb-px ${tab === 'upload' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
          >
            Upload
          </button>
          <button
            onClick={() => setTab('generate')}
            className={`text-xs px-3 py-1.5 -mb-px ${tab === 'generate' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
          >
            Generate
          </button>
        </div>

        {tab === 'upload' ? (
          <div className="space-y-2">
            <input
              type="url"
              value={brollUrl}
              onChange={(e) => setBrollUrl(e.target.value)}
              placeholder="B-roll video URL or file path"
              className="w-full rounded-md border px-3 py-1.5 text-xs"
            />
            <button
              onClick={() => {
                if (brollUrl.trim()) {
                  onApplyBroll(segment.index, 'broll_upload', brollUrl.trim());
                  setBrollUrl('');
                }
              }}
              disabled={!brollUrl.trim()}
              className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              Apply B-roll
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              value={brollPrompt}
              onChange={(e) => setBrollPrompt(e.target.value)}
              placeholder="Describe the b-roll you want: e.g. 'explosion effect with subscribe text'"
              rows={3}
              className="w-full rounded-md border px-3 py-1.5 text-xs resize-none"
            />
            <button
              onClick={() => {
                if (brollPrompt.trim()) {
                  onGenerateBroll(segment.index, brollPrompt.trim());
                  setBrollPrompt('');
                }
              }}
              disabled={!brollPrompt.trim()}
              className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              Generate AI B-roll
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(ms: number) {
  const totalSec = (ms / 1000).toFixed(1);
  return `${totalSec}s`;
}
