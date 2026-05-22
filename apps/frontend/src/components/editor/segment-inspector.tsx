'use client';

import { useState, useRef, useEffect } from 'react';
import { useGenerateMotion } from '@/hooks/use-motion';

interface Segment {
  index: number;
  text: string;
  startMs: number;
  endMs: number;
  type: string;
  brollUrl?: string | null;
  brollPrompt?: string | null;
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  templateId?: string;
  templateName?: string;
  previewUrl?: string;
  previewLoaded?: boolean;
}

interface SegmentInspectorProps {
  segment: Segment | null;
  onApplyBroll: (index: number, type: string, url?: string, prompt?: string) => void;
  onDeleteSegment: (index: number) => void;
  onReset: (index: number) => void;
}

const QUICK_PROMPTS = [
  { icon: '💥', label: 'Explosion effect', prompt: 'explosion burst effect' },
  { icon: '📝', label: 'Lower third title', prompt: 'lower third with title text' },
  { icon: '✨', label: 'Kinetic text reveal', prompt: 'kinetic text animation reveal' },
  { icon: '🔍', label: 'Spotlight highlight', prompt: 'spotlight highlight reveal' },
];

export function SegmentInspector({
  segment,
  onApplyBroll,
  onDeleteSegment,
  onReset,
}: SegmentInspectorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const generateMotion = useGenerateMotion();

  useEffect(() => {
    if (segment) {
      setMessages([]);
      setInput('');
    }
  }, [segment?.index]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!segment) {
    return (
      <div className="rounded-lg border p-6 min-h-[300px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Select a segment in the timeline to edit</p>
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    original: 'Original',
    broll_upload: 'Uploaded B-roll',
    broll_generated: 'AI Generated B-roll',
  };

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt || isGenerating) return;

    setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
    setInput('');
    setIsGenerating(true);

    try {
      const safePrompt = prompt.slice(0, 200);
      const result = await generateMotion.mutateAsync({
        prompt: safePrompt,
        durationMs: segment.endMs - segment.startMs,
        style: 'dark',
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `Generated b-roll video with prompt: "${safePrompt}"`,
          previewUrl: undefined,
        },
      ]);

      onApplyBroll(segment.index, 'broll_generated', undefined, safePrompt);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Failed to generate b-roll. Please try again.' },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="rounded-lg border flex flex-col h-full max-h-[calc(100vh-120px)]">
      <div className="p-3 border-b shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Segment {segment.index + 1}</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onReset(segment.index)}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted"
            >
              Reset
            </button>
            <button
              onClick={() => onDeleteSegment(segment.index)}
              className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{segment.text}</p>

        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          <span>{formatTime(segment.startMs)} - {formatTime(segment.endMs)}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-muted text-[10px]">
            {typeLabels[segment.type] || segment.type}
          </span>
        </div>
      </div>

      {segment.type !== 'original' && segment.brollPrompt && (
        <div className="px-3 py-1.5 bg-muted/50 border-b shrink-0">
          <p className="text-xs text-muted-foreground">
            B-roll prompt: <span className="font-medium text-foreground">{segment.brollPrompt}</span>
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground mb-3">
              Describe the b-roll motion graphic for this segment
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp.label}
                  onClick={() => handleQuickPrompt(qp.prompt)}
                  className="text-left text-xs px-2.5 py-1.5 rounded-md border hover:bg-muted/50 transition-colors"
                >
                  <span className="mr-1">{qp.icon}</span>
                  {qp.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted border'
              }`}
            >
              <p>{msg.content}</p>
              {msg.previewUrl && (
                <div className="mt-2">
                  <video
                    src={msg.previewUrl}
                    controls
                    className="w-full rounded max-h-32"
                    preload="metadata"
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-muted border rounded-lg px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Generating b-roll video...
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="p-3 border-t shrink-0">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe the b-roll you want..."
            className="flex-1 rounded-md border px-3 py-1.5 text-xs bg-background"
            disabled={isGenerating}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(ms: number) {
  const totalSec = (ms / 1000).toFixed(1);
  return `${totalSec}s`;
}
