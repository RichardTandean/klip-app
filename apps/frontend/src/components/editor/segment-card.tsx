'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const typeColors: Record<string, string> = {
  original: 'bg-blue-500',
  broll_upload: 'bg-green-500',
  broll_generated: 'bg-purple-500',
};

interface SegmentCardProps {
  index: number;
  text: string;
  type: string;
  durationMs: number;
  startMs?: number;
  isSelected: boolean;
  totalDurationMs: number;
  onClick: () => void;
  onDelete?: () => void;
}

export function SegmentCard({
  index,
  text,
  type,
  durationMs,
  isSelected,
  totalDurationMs,
  onClick,
  onDelete,
}: SegmentCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const widthPercent = totalDurationMs > 0 ? (durationMs / totalDurationMs) * 100 : 10;
  const minWidth = 80;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="h-full rounded cursor-pointer transition-all shrink-0 border-2 flex flex-col justify-center px-2 overflow-hidden relative group touch-none"
      title={`Segment ${index + 1}: "${text}"`}
      data-selected={isSelected ? 'true' : undefined}
    >
      <div
        className="h-full w-full absolute inset-0 rounded"
        style={{
          width: `${Math.max(widthPercent, 2)}%`,
          minWidth,
          borderColor: isSelected ? '#fff' : 'transparent',
          backgroundColor: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
        }}
      />
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
          title="Remove segment"
        >
          ×
        </button>
      )}
      <div className="relative z-0 flex items-center gap-1.5 mb-1">
        <div className={`w-2 h-2 rounded-full shrink-0 ${typeColors[type] || 'bg-gray-400'}`} />
        <span className="text-[10px] text-white/60">{index + 1}</span>
      </div>
      <p className="relative z-0 text-[10px] text-white/80 leading-tight line-clamp-2">{text}</p>
    </div>
  );
}
