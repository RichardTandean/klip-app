'use client';

import { useRef, useEffect } from 'react';
import { SegmentCard } from './segment-card';
import { useEditorStore } from '@/stores/editor-store';

interface Segment {
  index: number;
  text: string;
  startMs: number;
  endMs: number;
  type: string;
}

interface TimelineProps {
  segments: Segment[];
  totalDurationMs: number;
}

export function Timeline({ segments, totalDurationMs }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedSegmentIndex, selectSegment, currentTime, zoomLevel } = useEditorStore();

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const segment = el.querySelector('[data-selected="true"]');
    if (segment) {
      segment.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [selectedSegmentIndex]);

  const playheadPercent = totalDurationMs > 0 ? (currentTime * 1000 / totalDurationMs) * 100 : 0;
  const trackWidth = Math.max(100, 100 * zoomLevel);

  return (
    <div className="rounded-lg border bg-gray-900 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 font-medium">Timeline</span>
        <div className="flex items-center gap-2">
          <ZoomButton label="-" action="out" />
          <span className="text-xs text-gray-500">{Math.round(zoomLevel * 100)}%</span>
          <ZoomButton label="+" action="in" />
        </div>
      </div>

      <div className="relative">
        <div
          ref={containerRef}
          className="flex gap-0.5 h-20 overflow-x-auto scrollbar-thin pb-1"
          style={{ width: `${trackWidth}%` }}
        >
          {segments.map((seg) => (
            <SegmentCard
              key={seg.index}
              index={seg.index}
              text={seg.text}
              type={seg.type}
              durationMs={seg.endMs - seg.startMs}
              isSelected={selectedSegmentIndex === seg.index}
              totalDurationMs={totalDurationMs}
              onClick={() => selectSegment(seg.index)}
            />
          ))}
        </div>

        <div
          className="absolute top-0 h-full w-0.5 bg-red-500 z-10 pointer-events-none"
          style={{ left: `${Math.min(playheadPercent, 98)}%` }}
        />
      </div>
    </div>
  );
}

function ZoomButton({ label, action }: { label: string; action: 'in' | 'out' }) {
  const { zoomLevel, setZoomLevel } = useEditorStore();

  const handleZoom = () => {
    const delta = action === 'in' ? 0.25 : -0.25;
    const next = Math.max(0.5, Math.min(3, zoomLevel + delta));
    setZoomLevel(next);
  };

  return (
    <button
      onClick={handleZoom}
      className="w-6 h-6 rounded border border-gray-700 text-xs text-gray-400 hover:bg-gray-800 flex items-center justify-center"
    >
      {label}
    </button>
  );
}
