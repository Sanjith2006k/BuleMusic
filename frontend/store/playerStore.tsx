"use client";

import { create } from "zustand";

interface PlayerState {
  isPlaying: boolean;
  volume: number;
  shuffle: boolean;
  repeat: boolean;

  togglePlay: () => void;
  toggleShuffle: () => void;
  setShuffle: (val: boolean) => void;
  toggleRepeat: () => void;
  setVolume: (volume: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isPlaying: false,
  volume: 80,
  shuffle: false,
  repeat: false,

  togglePlay: () =>
    set((state) => ({
      isPlaying: !state.isPlaying,
    })),

  toggleShuffle: () =>
    set((state) => ({
      shuffle: !state.shuffle,
    })),

  setShuffle: (val: boolean) =>
    set({
      shuffle: val,
    }),

  toggleRepeat: () =>
    set((state) => ({
      repeat: !state.repeat,
    })),

  setVolume: (volume) =>
    set({
      volume,
    }),
}));
