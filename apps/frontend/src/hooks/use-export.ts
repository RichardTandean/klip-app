'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface ExportJob {
  id: string;
  editId: string;
  userId: string;
  format: string;
  resolution: string;
  quality: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  r2Url: string | null;
  r2Key: string | null;
  downloadUrl?: string | null;
  error?: string | null;
  createdAt: string;
  completedAt: string | null;
}

export function useTriggerExport(editId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (format: { aspectRatio: string; resolution: string; quality: string }) =>
      api<ExportJob>('/exports', {
        method: 'POST',
        body: JSON.stringify({ editId, ...format }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exports', editId] });
      toast.success('Export started');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Export failed');
    },
  });
}

export function useExportJob(jobId: string | null) {
  return useQuery({
    queryKey: ['exports', 'job', jobId],
    queryFn: () => api<ExportJob & { downloadUrl: string | null }>(`/exports/${jobId}`),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === 'COMPLETED' || data?.status === 'FAILED') return false;
      return 3000;
    },
  });
}
