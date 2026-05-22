const steps = [
  { key: 'PENDING', label: 'Queued' },
  { key: 'DOWNLOADING', label: 'Download' },
  { key: 'TRANSCRIBING', label: 'Transcribe' },
  { key: 'ANALYZING', label: 'AI Analysis' },
  { key: 'READY', label: 'Ready' },
];

const order = ['PENDING', 'DOWNLOADING', 'TRANSCRIBING', 'ANALYZING', 'READY'];

export function StatusTimeline({ status }: { status: string }) {
  const currentIdx = order.indexOf(status);
  const isFailed = status === 'FAILED';
  const isComplete = status === 'READY';

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center gap-1 flex-1">
          <div className="flex flex-col items-center gap-1 flex-1">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isFailed
                  ? 'bg-red-500'
                  : i <= currentIdx && currentIdx >= 0
                    ? 'bg-primary'
                    : 'bg-muted'
              } ${i <= currentIdx && !isFailed ? 'animate-pulse' : ''}`}
            />
            <span className="text-[10px] text-muted-foreground text-center leading-tight">
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-0.5 flex-1 ${
                isFailed
                  ? 'bg-red-200'
                  : i < currentIdx
                    ? 'bg-primary'
                    : 'bg-muted'
              }`}
            />
          )}
        </div>
      ))}

      {isFailed && (
        <span className="text-xs font-medium text-red-600 ml-2">Failed</span>
      )}
      {isComplete && (
        <span className="text-xs font-medium text-green-600 ml-2">Ready</span>
      )}
    </div>
  );
}
