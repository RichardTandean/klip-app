'use client';

import Link from 'next/link';
import type { Project } from '@/hooks/use-projects';

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  DOWNLOADING: 'Downloading',
  TRANSCRIBING: 'Transcribing',
  ANALYZING: 'Analyzing',
  READY: 'Ready',
  FAILED: 'Failed',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  DOWNLOADING: 'bg-blue-100 text-blue-800',
  TRANSCRIBING: 'bg-purple-100 text-purple-800',
  ANALYZING: 'bg-indigo-100 text-indigo-800',
  READY: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

export function ProjectCard({ project }: { project: Project }) {
  const date = new Date(project.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="rounded-lg border p-4 transition-colors hover:bg-muted/50">
        <div className="aspect-video mb-3 rounded-md bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">No preview</span>
        </div>

        <h3 className="font-medium text-sm truncate">{project.title}</h3>

        <div className="flex items-center gap-2 mt-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}`}
          >
            {statusLabels[project.status] || project.status}
          </span>

          {project._count?.clips ? (
            <span className="text-xs text-muted-foreground">
              {project._count.clips} clip{project._count.clips !== 1 ? 's' : ''}
            </span>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground mt-1">{date}</p>
      </div>
    </Link>
  );
}
