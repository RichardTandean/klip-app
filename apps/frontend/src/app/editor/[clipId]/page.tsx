'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useCreateEdit, useEdit, useUpdateSegment } from '@/hooks/use-edit';
import { useTranscript } from '@/hooks/use-projects';
import { useEditorStore } from '@/stores/editor-store';
import { Navbar } from '@/components/navbar';
import { PreviewPlayer } from '@/components/editor/preview-player';
import { Timeline } from '@/components/editor/timeline';
import { SegmentInspector } from '@/components/editor/segment-inspector';
import { ExportToolbar } from '@/components/editor/export-toolbar';

function formatTimestamp(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}.${Math.floor((ms % 1000) / 100)}`;
}

export default function EditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const clipId = params.clipId as string;
  const projectId = searchParams.get('projectId') || '';

  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const createEdit = useCreateEdit();

  const { selectedSegmentIndex, selectSegment, triggerSeek } = useEditorStore();

  const editId = createEdit.data?.id || '';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (clipId && user) {
      createEdit.mutate(clipId);
    }
  }, [clipId, user, authLoading]);

  const { data: edit, isLoading: editLoading } = useEdit(editId);
  const { data: transcript } = useTranscript(projectId);

  const updateSegmentMutation = useUpdateSegment(editId);

  const clipStartMs = edit?.clip?.startMs || 0;

  const clipSegments = useMemo(() => {
    if (!transcript?.segments || !edit?.clip) return [];

    const { startSegmentIndex, endSegmentIndex } = edit.clip;

    return transcript.segments
      .filter((seg) => seg.index >= startSegmentIndex && seg.index <= endSegmentIndex)
      .map((seg) => {
        const segOverride = edit.segments.find((es) => es.segmentIndex === seg.index);
        return {
          ...seg,
          type: segOverride?.type || 'original',
          brollUrl: segOverride?.brollUrl,
          brollPrompt: segOverride?.brollPrompt,
          relativeStartMs: seg.startMs - clipStartMs,
          relativeEndMs: seg.endMs - clipStartMs,
        };
      });
  }, [transcript, edit, clipStartMs]);

  const totalDurationMs = useMemo(() => {
    if (clipSegments.length === 0) return 60000;
    return clipSegments[clipSegments.length - 1].relativeEndMs;
  }, [clipSegments]);

  const selectedSegment = clipSegments.find((s) => s.index === selectedSegmentIndex) || null;

  const handleApplyBroll = useCallback(
    (segmentIndex: number, type: string, url?: string, prompt?: string) => {
      updateSegmentMutation.mutate({
        segmentIndex,
        type,
        brollUrl: url,
        brollPrompt: prompt,
      });
    },
    [updateSegmentMutation, editId],
  );

  const handleReset = useCallback(
    (segmentIndex: number) => {
      updateSegmentMutation.mutate({ segmentIndex, type: 'original' });
    },
    [updateSegmentMutation, editId],
  );

  const handleDeleteSegment = useCallback(
    (segmentIndex: number) => {
      updateSegmentMutation.mutate({ segmentIndex, type: 'broll_upload' });
    },
    [updateSegmentMutation, editId],
  );

  const handleSelectSegment = useCallback(
    (index: number, relativeStartMs: number) => {
      selectSegment(index);
      triggerSeek(relativeStartMs / 1000);
    },
    [selectSegment, triggerSeek],
  );

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (editLoading || createEdit.isPending) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-6xl mx-auto p-6 animate-pulse space-y-4">
          <div className="aspect-video bg-muted rounded-lg" />
          <div className="h-24 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!edit) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-6xl mx-auto p-6">
          <p className="text-muted-foreground">Edit session not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex items-center justify-between px-6 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">{edit.clip?.title || 'Editor'}</span>
          <span className="text-xs text-muted-foreground">
            {clipSegments.length} segments · {formatTimestamp(totalDurationMs)}
          </span>
        </div>
        <ExportToolbar editId={editId} />
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col p-4 gap-3 min-w-0">
          <PreviewPlayer src={`/api/stream/clip/${clipId}`} />

          <Timeline
            segments={clipSegments.map((s) => ({
              index: s.index,
              text: s.text,
              type: s.type,
              startMs: s.relativeStartMs,
              endMs: s.relativeEndMs,
            }))}
            totalDurationMs={totalDurationMs}
            onSelectSegment={handleSelectSegment}
            onDeleteSegment={handleDeleteSegment}
          />
        </div>

        <div className="w-80 shrink-0 border-l bg-muted/10">
          <SegmentInspector
            segment={
              selectedSegment
                ? {
                    index: selectedSegment.index,
                    text: selectedSegment.text,
                    startMs: selectedSegment.relativeStartMs,
                    endMs: selectedSegment.relativeEndMs,
                    type: selectedSegment.type,
                    brollUrl: selectedSegment.brollUrl,
                    brollPrompt: selectedSegment.brollPrompt,
                  }
                : null
            }
            onApplyBroll={handleApplyBroll}
            onDeleteSegment={handleDeleteSegment}
            onReset={handleReset}
          />
        </div>
      </div>
    </div>
  );
}
