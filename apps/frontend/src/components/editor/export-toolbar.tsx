'use client';

import { useState, useEffect } from 'react';
import { useTriggerExport, useExportJob } from '@/hooks/use-export';

interface ExportToolbarProps {
  editId: string;
}

export function ExportToolbar({ editId }: ExportToolbarProps) {
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('1080p');
  const [exportJobId, setExportJobId] = useState<string | null>(null);

  const triggerExport = useTriggerExport(editId);
  const { data: exportJob } = useExportJob(exportJobId);

  useEffect(() => {
    if (triggerExport.data?.id) {
      setExportJobId(triggerExport.data.id);
    }
  }, [triggerExport.data?.id]);

  const handleExport = () => {
    triggerExport.mutate({ aspectRatio, resolution, quality: 'high' });
  };

  const isExporting = exportJob?.status === 'QUEUED' || exportJob?.status === 'PROCESSING';
  const isComplete = exportJob?.status === 'COMPLETED';

  return (
    <div className="flex items-center gap-3">
      <select
        value={aspectRatio}
        onChange={(e) => setAspectRatio(e.target.value)}
        className="rounded-md border px-2 py-1.5 text-xs bg-background"
      >
        <option value="16:9">16:9</option>
        <option value="9:16">9:16</option>
        <option value="1:1">1:1</option>
      </select>

      <select
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
        className="rounded-md border px-2 py-1.5 text-xs bg-background"
      >
        <option value="1080p">1080p</option>
        <option value="720p">720p</option>
      </select>

      {isComplete && exportJob?.downloadUrl ? (
        <a
          href={exportJob.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700"
        >
          Download
        </a>
      ) : (
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isExporting
            ? `Exporting ${exportJob?.progress || 0}%`
            : triggerExport.isPending
              ? 'Starting...'
              : 'Export'}
        </button>
      )}
    </div>
  );
}
