'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface EditSegment {
  id: string;
  editId: string;
  segmentIndex: number;
  type: 'original' | 'broll_upload' | 'broll_generated';
  brollUrl?: string | null;
  brollPrompt?: string | null;
}

export interface EditData {
  id: string;
  clipId: string;
  projectId: string;
  userId: string;
  status: string;
  signedUrl: string | null;
  clipPreviewUrl: string | null;
  video: {
    id: string;
    r2Url: string;
    r2Key: string;
    durationMs: number;
  } | null;
  clip: {
    title: string;
    startMs: number;
    endMs: number;
    durationMs: number;
    startSegmentIndex: number;
    endSegmentIndex: number;
  };
  segments: EditSegment[];
  r2Url?: string | null;
}

export function useEdit(editId: string) {
  return useQuery({
    queryKey: ['edits', editId],
    queryFn: () => api<EditData>(`/edits/${editId}`),
    enabled: !!editId,
  });
}

export function useCreateEdit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clipId: string) =>
      api<EditData>('/edits', { method: 'POST', body: JSON.stringify({ clipId }) }),
    onSuccess: (data) => {
      queryClient.setQueryData(['edits', data.id], data);
      toast.success('Edit session created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create edit');
    },
  });
}

export function useUpdateSegment(editId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      segmentIndex,
      type,
      brollUrl,
      brollPrompt,
    }: {
      segmentIndex: number;
      type: string;
      brollUrl?: string;
      brollPrompt?: string;
    }) =>
      api(`/edits/${editId}/segments/${segmentIndex}`, {
        method: 'PATCH',
        body: JSON.stringify({ type, brollUrl, brollPrompt }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edits', editId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update segment');
    },
  });
}
