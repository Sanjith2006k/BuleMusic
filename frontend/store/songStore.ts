import { create } from "zustand";

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  cover: string;
  url: string;
}

interface SongState {
  songs: Song[];
  isLoading: boolean;
  error: string | null;
  fetchSongs: () => Promise<void>;
  refreshSongs: () => Promise<number>;
  getSongById: (id: string) => Song | undefined;
}

export const useSongStore = create<SongState>((set, get) => ({
  songs: [],
  isLoading: false,
  error: null,
  
  fetchSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/songs`);
      if (!response.ok) {
        throw new Error("Failed to fetch songs");
      }
      const data = await response.json();
      set({ songs: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  refreshSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/songs/refresh`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to refresh songs");
      }
      const data = await response.json();
      set({ songs: data.songs, isLoading: false });
      return data.newCount;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return 0;
    }
  },

  getSongById: (id) => {
    return get().songs.find((s) => s.id === id);
  },
}));
