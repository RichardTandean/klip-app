'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000';

interface StatusUpdate {
  status: string;
  message?: string;
  progress?: number;
}

export function useWebSocket(
  projectId: string | null,
  onUpdate?: (data: StatusUpdate) => void,
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const socket = io(`${WS_URL}/projects`, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      socket.emit('subscribe', { projectId });
    });

    socket.on('status.update', (data: StatusUpdate) => {
      onUpdate?.(data);
    });

    socket.on('connect_error', () => {
      // Silently retry
    });

    socketRef.current = socket;

    return () => {
      socket.emit('unsubscribe', { projectId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [projectId, onUpdate]);

  const resubscribe = useCallback(
    (newProjectId: string) => {
      const socket = socketRef.current;
      if (!socket) return;
      if (projectId) socket.emit('unsubscribe', { projectId });
      socket.emit('subscribe', { projectId: newProjectId });
    },
    [projectId],
  );

  return { resubscribe };
}
