'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useProjects } from '@/hooks/use-projects';
import { Navbar } from '@/components/navbar';
import { ProjectCard } from '@/components/project-card';
import { CreateProjectDialog } from '@/components/create-project-dialog';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data: projects, isLoading } = useProjects();
  const [showCreate, setShowCreate] = useState(false);

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

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create clips from YouTube videos
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            + New Project
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border p-4 animate-pulse">
                <div className="aspect-video bg-muted rounded-md mb-3" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">
              No projects yet. Paste a YouTube URL to get started.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
            >
              Create your first project
            </button>
          </div>
        )}
      </main>

      <CreateProjectDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
