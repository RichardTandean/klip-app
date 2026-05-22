'use client';

import { useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useCreateEdit, useEdit, useUpdateSegment } from '@/hooks/use-edit';
import { useGenerateMotion } from '@/hooks/use-motion';
import { useTranscript } from '@/hooks/use-projects';
import { useEditorStore } from '@/stores/editor-store';
import { Navbar } from '@/components/navbar';
import { PreviewPlayer } from '@/components/editor/preview-player';
import { Timeline } from '@/components/editor/timeline';
import { SegmentInspector } from '@/components/editor/segment-inspector';
import { ExportToolbar } from '@/components/editor/export-toolbar';

export default function EditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const clipId = params.clipId as string;
  const projectId = searchParams.get('projectId') || '';

  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const createEdit = useCreateEdit();
  const updateSegment = useUpdateSegment('');

  const { selectedSegmentIndex } = useEditorStore();

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
  const generateMotion = useGenerateMotion();

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

  const handleGenerateBroll = useCallback(
    (segmentIndex: number, prompt: string) => {
      generateMotion.mutate(
        { prompt, durationMs: 5000 },
        {
          onSuccess: (data) => {
            updateSegmentMutation.mutate({
              segmentIndex,
              type: 'broll_generated',
              brollPrompt: prompt,
            });
          },
        },
      );
    },
    [generateMotion, updateSegmentMutation, editId],
  );

  const handleReset = useCallback(
    (segmentIndex: number) => {
      updateSegmentMutation.mutate({ segmentIndex, type: 'original' });
    },
    [updateSegmentMutation, editId],
  );

  const handleExport = useCallback(
    (format: { aspectRatio: string; resolution: string; quality: string }) => {
      // Phase 8: trigger export
      console.log('Export:', format);
    },
    [],
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

  const segments = (transcript?.segments || []).map((seg) => {
    const segOverride = edit.segments.find((es) => es.segmentIndex === seg.index);
    return {
      ...seg,
      type: segOverride?.type || 'original',
      brollUrl: segOverride?.brollUrl,
      brollPrompt: segOverride?.brollPrompt,
    };
  });

  const totalDurationMs = segments.length > 0
    ? segments[segments.length - 1].endMs - segments[0].startMs
    : 60000;

  const selectedSegment = segments.find((s) => s.index === selectedSegmentIndex) || null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex items-center justify-between px-6 py-2 border-b">
        <div>
          <span className="text-sm font-medium">{edit.clip?.title || 'Editor'}</span>
        </div>
        <ExportToolbar editId={editId} />
      </div>

      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col p-4 gap-3 min-w-0">
          <PreviewPlayer src={edit.signedUrl} />
          <Timeline segments={segments} totalDurationMs={totalDurationMs} />
        </div>

        <div className="w-80 shrink-0 border-l p-4">
          <SegmentInspector
            segment={selectedSegment}
            onApplyBroll={handleApplyBroll}
            onGenerateBroll={handleGenerateBroll}
            onReset={handleReset}
          />
        </div>
      </div>
    </div>
  );
}
