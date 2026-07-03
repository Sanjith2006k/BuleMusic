import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Member {
  id: string;
  name: string;
  isHost: boolean;
}

export interface QueueItem {
  id: string;
  songId: string;
  addedBy: string;
}

interface RoomState {
  roomCode: string | null;
  hostId: string | null;
  members: Member[];
  userId: string;
  queue: QueueItem[];
  activePlaylistId: string | null;
  playlistQueue: QueueItem[];
  
  setRoomState: (state: Partial<RoomState>) => void;
  setUserId: (id: string) => void;
  setQueue: (queue: QueueItem[]) => void;
  setActivePlaylistId: (id: string | null) => void;
  setPlaylistQueue: (queue: QueueItem[]) => void;
}

export const useRoomStore = create<RoomState>()(
  persist(
    (set) => ({
      roomCode: null,
      hostId: null,
      members: [],
      userId: "", 
      queue: [],
      activePlaylistId: null,
      playlistQueue: [],
      
      setRoomState: (state) => set(state),
      setUserId: (id) => set({ userId: id }),
      setQueue: (queue) => set({ queue }),
      setActivePlaylistId: (id) => set({ activePlaylistId: id }),
      setPlaylistQueue: (queue) => set({ playlistQueue: queue }),
    }),
    {
      name: "room-storage",
      partialize: (state) => ({ 
        userId: state.userId,
        roomCode: state.roomCode,
        activePlaylistId: state.activePlaylistId,
        playlistQueue: state.playlistQueue,
        hostId: state.hostId
      }),
    }
  )
);
