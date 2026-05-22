'use client';

import { useRef, useEffect, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
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
  onDeleteSegment?: (index: number) => void;
  onSelectSegment?: (index: number, startMs: number) => void;
  onReorderSegments?: (fromIndex: number, toIndex: number) => void;
}

function formatTimeRuler(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) return `${min}:${sec.toString().padStart(2, '0')}`;
  return `0:${sec.toString().padStart(2, '0')}`;
}

export function Timeline({
  segments,
  totalDurationMs,
  onDeleteSegment,
  onSelectSegment,
  onReorderSegments,
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedSegmentIndex, selectSegment, currentTime, zoomLevel } = useEditorStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const segmentIds = useMemo(() => segments.map((s) => s.index), [segments]);

  const playheadPercent = totalDurationMs > 0 ? (currentTime * 1000 / totalDurationMs) * 100 : 0;
  const trackWidth = Math.max(100, 100 * zoomLevel);

  const timeMarkers = useMemo(() => {
    if (totalDurationMs <= 0) return [];
    const markers: number[] = [];
    const interval = totalDurationMs <= 10000 ? 1000 :
                     totalDurationMs <= 30000 ? 2000 :
                     totalDurationMs <= 60000 ? 5000 :
                     10000;

    for (let ms = 0; ms <= totalDurationMs; ms += interval) {
      markers.push(ms);
    }
    return markers;
  }, [totalDurationMs]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorderSegments?.(Number(active.id), Number(over.id));
  };

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
        <div className="h-5 relative mb-0.5" style={{ width: `${trackWidth}%` }}>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-700" />
          {timeMarkers.map((ms) => {
            const pct = totalDurationMs > 0 ? (ms / totalDurationMs) * 100 : 0;
            return (
              <div key={ms} className="absolute top-0 flex flex-col items-center" style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}>
                <div className="w-px h-2 bg-gray-600" />
                <span className="text-[9px] text-gray-500 mt-0.5">{formatTimeRuler(ms)}</span>
              </div>
            );
          })}
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={segmentIds} strategy={horizontalListSortingStrategy}>
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
                  startMs={seg.startMs}
                  durationMs={seg.endMs - seg.startMs}
                  isSelected={selectedSegmentIndex === seg.index}
                  totalDurationMs={totalDurationMs}
                  onClick={() => onSelectSegment ? onSelectSegment(seg.index, seg.startMs) : selectSegment(seg.index)}
                  onDelete={onDeleteSegment ? () => onDeleteSegment(seg.index) : undefined}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div
          className="absolute top-5 h-20 w-0.5 bg-red-500 z-20 pointer-events-none"
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
