'use client';

import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { useEditorStore } from '@/stores/editor-store';

interface PreviewPlayerProps {
  src: string | null | undefined;
}

export function PreviewPlayer({ src }: PreviewPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const { setCurrentTime, setIsPlaying } = useEditorStore();

  useEffect(() => {
    if (!videoRef.current || !src) return;

    const player = videojs(videoRef.current, {
      controls: true,
      fluid: true,
      aspectRatio: '16:9',
      sources: [{ src, type: 'video/mp4' }],
    });

    player.on('timeupdate', () => {
      setCurrentTime(player.currentTime() ?? 0);
    });

    player.on('play', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));

    playerRef.current = player;

    return () => {
      player.dispose();
      playerRef.current = null;
    };
  }, [src, setCurrentTime, setIsPlaying]);

  return (
    <div ref={containerRef} className="rounded-lg overflow-hidden bg-black">
      <div data-vjs-player>
        <video ref={videoRef} className="video-js vjs-big-play-centered" />
      </div>
    </div>
  );
}
