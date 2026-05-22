import { create } from 'zustand';

interface EditorState {
  selectedSegmentIndex: number | null;
  currentTime: number;
  isPlaying: boolean;
  zoomLevel: number;
  selectSegment: (index: number | null) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setZoomLevel: (zoom: number) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  selectedSegmentIndex: null,
  currentTime: 0,
  isPlaying: false,
  zoomLevel: 1,
  selectSegment: (index) => set({ selectedSegmentIndex: index }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
}));
