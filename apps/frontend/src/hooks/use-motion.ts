'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface MotionGraphic {
  id: string;
  userId: string;
  prompt: string;
  template: string;
  status: string;
  r2Url: string | null;
  r2Key: string | null;
  signedUrl?: string | null;
  createdAt: string;
  completedAt: string | null;
}

export function useGenerateMotion() {
  return useMutation({
    mutationFn: (data: { prompt: string; durationMs: number; style?: string }) =>
      api<{ id: string; status: string; prompt: string }>('/motion/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      toast.success(`B-roll "${data.prompt}" generated`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate motion graphic');
    },
  });
}

export function useMotionGraphics() {
  return useQuery({
    queryKey: ['motion'],
    queryFn: () => api<MotionGraphic[]>('/motion'),
  });
}

export function useMotionGraphic(id: string) {
  return useQuery({
    queryKey: ['motion', id],
    queryFn: () => api<MotionGraphic & { signedUrl: string | null }>(`/motion/${id}`),
    enabled: !!id,
  });
}
