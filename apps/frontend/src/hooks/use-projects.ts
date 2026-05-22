import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface Project {
  id: string;
  userId: string;
  title: string;
  youtubeUrl: string;
  status: 'PENDING' | 'DOWNLOADING' | 'TRANSCRIBING' | 'ANALYZING' | 'READY' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  _count?: { clips: number };
  videos?: Video[];
  clips?: Clip[];
}

export interface Video {
  id: string;
  projectId: string;
  youtubeUrl: string;
  r2Url: string;
  r2Key: string;
  durationMs: number;
  thumbnailUrl: string | null;
}

export interface TranscriptSegment {
  id: string;
  transcriptId: string;
  index: number;
  text: string;
  startMs: number;
  endMs: number;
}

export interface Transcript {
  fullText: string | null;
  segments: TranscriptSegment[];
}

export interface Clip {
  id: string;
  projectId: string;
  title: string;
  startSegmentIndex: number;
  endSegmentIndex: number;
  startMs: number;
  endMs: number;
  durationMs: number;
  reasoning: string;
  viralScore: number;
  status: string;
  createdAt: string;
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api<Project[]>('/projects'),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => api<Project>(`/projects/${id}`),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { youtubeUrl: string; title?: string }) =>
      api<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create project');
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api(`/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete project');
    },
  });
}

export function useTranscript(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'transcript'],
    queryFn: () => api<Transcript>(`/projects/${projectId}/transcript`),
    enabled: !!projectId,
  });
}

export function useClips(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'clips'],
    queryFn: () => api<Clip[]>(`/projects/${projectId}/clips`),
    enabled: !!projectId,
  });
}

export function useAnalyzeClips(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api(`/projects/${projectId}/clips/analyze`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'clips'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      toast.success('Analysis started');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Analysis failed');
    },
  });
}

export function useClipPreview(projectId: string, clipId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'clips', clipId, 'preview'],
    queryFn: () =>
      api<{ previewUrl: string; durationMs: number; clipTitle: string }>(
        `/projects/${projectId}/clips/${clipId}/preview`,
      ),
    enabled: !!projectId && !!clipId,
    staleTime: 300000,
  });
}
