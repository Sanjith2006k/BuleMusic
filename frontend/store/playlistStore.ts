import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Playlist {
  id: string;
  name: string;
  songIds: string[];
}

interface PlaylistStore {
  playlists: Playlist[];
  createPlaylist: (name: string, initialSongIds?: string[]) => void;
  deletePlaylist: (id: string) => void;
  addSongToPlaylist: (playlistId: string, songId: string) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
}

export const usePlaylistStore = create<PlaylistStore>()(
  persist(
    (set) => ({
      playlists: [],
      
      createPlaylist: (name, initialSongIds = []) => 
        set((state) => ({
          playlists: [
            ...state.playlists,
            { 
              id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15), 
              name, 
              songIds: initialSongIds 
            }
          ]
        })),
        
      deletePlaylist: (id) =>
        set((state) => ({
          playlists: state.playlists.filter(p => p.id !== id)
        })),
        
      addSongToPlaylist: (playlistId, songId) =>
        set((state) => ({
          playlists: state.playlists.map(p => {
            if (p.id === playlistId && !p.songIds.includes(songId)) {
              return { ...p, songIds: [...p.songIds, songId] };
            }
            return p;
          })
        })),
        
      removeSongFromPlaylist: (playlistId, songId) =>
        set((state) => ({
          playlists: state.playlists.map(p => {
            if (p.id === playlistId) {
              return { ...p, songIds: p.songIds.filter(id => id !== songId) };
            }
            return p;
          })
        }))
    }),
    {
      name: "bule-playlists",
    }
  )
);
