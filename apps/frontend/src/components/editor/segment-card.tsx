'use client';

const typeColors: Record<string, string> = {
  original: 'bg-blue-500',
  broll_upload: 'bg-green-500',
  broll_generated: 'bg-purple-500',
};

const typeLabels: Record<string, string> = {
  original: 'Original',
  broll_upload: 'B-roll',
  broll_generated: 'AI B-roll',
};

interface SegmentCardProps {
  index: number;
  text: string;
  type: string;
  durationMs: number;
  isSelected: boolean;
  totalDurationMs: number;
  onClick: () => void;
}

export function SegmentCard({
  index,
  text,
  type,
  durationMs,
  isSelected,
  totalDurationMs,
  onClick,
}: SegmentCardProps) {
  const widthPercent = totalDurationMs > 0 ? (durationMs / totalDurationMs) * 100 : 10;
  const minWidth = 80;

  return (
    <div
      onClick={onClick}
      className="h-full rounded cursor-pointer transition-all shrink-0 border-2 flex flex-col justify-center px-2 overflow-hidden"
      style={{
        width: `${Math.max(widthPercent, 2)}%`,
        minWidth,
        borderColor: isSelected ? '#fff' : 'transparent',
        backgroundColor: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
      }}
      title={`Segment ${index + 1}: "${text}"`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <div className={`w-2 h-2 rounded-full shrink-0 ${typeColors[type] || 'bg-gray-400'}`} />
        <span className="text-[10px] text-white/60">{index + 1}</span>
      </div>
      <p className="text-[10px] text-white/80 leading-tight line-clamp-2">{text}</p>
    </div>
  );
}
