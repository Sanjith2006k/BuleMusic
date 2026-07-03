"use client";

import { createContext } from "react";

export interface AudioContextType {
  audio: HTMLAudioElement | null;
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  loadSong: (url: string) => void;
  setVolume: (volume: number) => void;
}

export const AudioContext = createContext<AudioContextType>({
  audio: null,
  play: async () => {},
  pause: () => {},
  seek: () => {},
  loadSong: () => {},
  setVolume: () => {},
});
