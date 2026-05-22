import { create } from 'zustand';

interface EditorState {
  selectedSegmentIndex: number | null;
  currentTime: number;
  isPlaying: boolean;
  zoomLevel: number;
  seekTo: number | null;
  selectSegment: (index: number | null) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setZoomLevel: (zoom: number) => void;
  triggerSeek: (time: number) => void;
  clearSeek: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  selectedSegmentIndex: null,
  currentTime: 0,
  isPlaying: false,
  zoomLevel: 1,
  seekTo: null,
  selectSegment: (index) => set({ selectedSegmentIndex: index }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
  triggerSeek: (time) => set({ seekTo: time }),
  clearSeek: () => set({ seekTo: null }),
}));
