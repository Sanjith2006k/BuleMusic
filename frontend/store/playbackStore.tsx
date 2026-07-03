import { create } from "zustand";

interface PlaybackState {
  songId: string | null;

  playing: boolean;

  currentTime: number;

  uiCurrentTime: number;

  duration: number;

  updatedAt: number | null;

  volume: number;

  setPlaying: (value: boolean) => void;

  setCurrentTime: (time: number) => void;
  
  setUiCurrentTime: (time: number) => void;

  setDuration: (time: number) => void;

  setVolume: (volume: number) => void;

  setPlayback: (state: Partial<PlaybackState>) => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  songId: null,

  playing: false,

  currentTime: 0,
  
  uiCurrentTime: 0,

  duration: 0,

  updatedAt: null,

  volume: 80,

  setPlaying: (playing) => set({ playing }),

  setCurrentTime: (currentTime) => set({ currentTime, uiCurrentTime: currentTime }),
  
  setUiCurrentTime: (uiCurrentTime) => set({ uiCurrentTime }),

  setDuration: (duration) => set({ duration }),

  setVolume: (volume) => set({ volume }),

  setPlayback: (state) => set(state),
}));
