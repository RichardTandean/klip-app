'use client';

import { useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import {
  useProject,
  useTranscript,
  useClips,
  useAnalyzeClips,
} from '@/hooks/use-projects';
import { useWebSocket } from '@/hooks/use-websocket';
import { Navbar } from '@/components/navbar';
import { StatusTimeline } from '@/components/status-timeline';
import { ClipCard } from '@/components/clip-card';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useProject(projectId);
  const { data: transcript } = useTranscript(projectId);
  const { data: clips } = useClips(projectId);
  const analyzeClips = useAnalyzeClips(projectId);

  const handleStatusUpdate = useCallback(
    (data: { status: string; message?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'clips'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'transcript'] });
    },
    [projectId, queryClient],
  );

  useWebSocket(projectId, handleStatusUpdate);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6 animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6">
          <p className="text-muted-foreground">Project not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-sm text-muted-foreground mt-1 truncate">
            {project.youtubeUrl}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <StatusTimeline status={project.status} />
        </div>

        {project.status === 'READY' && clips && clips.length === 0 && (
          <div className="text-center py-8 border rounded-lg">
            <p className="text-muted-foreground mb-3">
              Transcript ready. Run AI analysis to find the best clips.
            </p>
            <button
              onClick={() => analyzeClips.mutate()}
              disabled={analyzeClips.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {analyzeClips.isPending ? 'Analyzing...' : 'Find Viral Clips'}
            </button>
          </div>
        )}

        {(project.status === 'DOWNLOADING' ||
          project.status === 'TRANSCRIBING' ||
          project.status === 'ANALYZING' ||
          project.status === 'PENDING') && (
          <div className="text-center py-8 border rounded-lg">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-muted-foreground">
              {project.status === 'DOWNLOADING' && 'Downloading video...'}
              {project.status === 'TRANSCRIBING' && 'Transcribing audio...'}
              {project.status === 'ANALYZING' && 'AI is finding the best clips...'}
              {project.status === 'PENDING' && 'Queued for processing...'}
            </p>
          </div>
        )}

        {clips && clips.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">
              Clip Recommendations ({clips.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {clips.map((clip) => (
                <ClipCard key={clip.id} clip={clip} projectId={projectId} />
              ))}
            </div>
          </div>
        )}

        {transcript && transcript.segments.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Transcript</h2>
            <div className="rounded-lg border divide-y max-h-96 overflow-y-auto">
              {transcript.segments.map((seg) => (
                <div key={seg.id} className="p-3 text-sm flex gap-3">
                  <span className="text-xs text-muted-foreground shrink-0 w-12 text-right">
                    {formatMs(seg.startMs)}
                  </span>
                  <p>{seg.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function formatMs(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}
