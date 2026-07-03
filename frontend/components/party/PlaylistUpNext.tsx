"use client";

import GlassCard from "../ui/GlassCard";
import { useRoomStore } from "@/store/roomStore";
import { useSongStore } from "@/store/songStore";
import { usePlaybackStore } from "@/store/playbackStore";
import { usePlaylistStore } from "@/store/playlistStore";
import { usePlayerStore } from "@/store/playerStore";
import Image from "next/image";
import { Play, Shuffle, GripVertical } from "lucide-react";
import useSocket from "@/hooks/useSocket";
import useAudio from "@/hooks/useAudio";
import { Reorder, useDragControls } from "framer-motion";
import { useState } from "react";

export default function PlaylistUpNext() {
  const playlistQueue = useRoomStore((state) => state.playlistQueue);
  const { activePlaylistId, userId, hostId, roomCode, setPlaylistQueue } = useRoomStore();
  const getSongById = useSongStore((state) => state.getSongById);
  const currentSongId = usePlaybackStore((state) => state.songId);
  const playlists = usePlaylistStore((state) => state.playlists);
  const shuffle = usePlayerStore((state) => state.shuffle);

  const socket = useSocket();
  const { play } = useAudio();

  const isHost = userId === hostId && hostId !== null;

  const [isDragging, setIsDragging] = useState(false);

  const activePlaylist = activePlaylistId ? playlists.find(p => p.id === activePlaylistId) : null;

  const handlePlayFromQueue = (index: number, songId: string) => {
    if (!isHost && roomCode) return;
    if (isDragging) return; // Prevent click if we were dragging

    // The new queue should be everything AFTER this clicked index
    const newQueue = playlistQueue.slice(index + 1);
    
    setPlaylistQueue(newQueue);

    if (roomCode) {
      socket.emit("set-queue", { roomCode, queue: newQueue });
      
      socket.emit("play", {
        roomCode,
        currentTime: 0,
        songId: songId
      });
      // The host will receive the updated playback-state from the backend instantly,
      // which has the correct startedAt timestamp. This prevents latency desyncs.
    } else {
      // Offline mode (not in a room)
      usePlaybackStore.setState({ 
        songId: songId, 
        playing: true, 
        currentTime: 0, 
        startedAt: Date.now() 
      });
    }
  };

  const handleReorder = (newOrder: typeof playlistQueue) => {
    if (!isHost) return;
    setPlaylistQueue(newOrder);
    if (roomCode) {
      socket.emit("set-queue", { roomCode, queue: newOrder });
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Up Next</h2>
          {activePlaylist && (
            <p className="text-xs text-zinc-500 mt-0.5">
              From: {activePlaylist.name}
              {shuffle && <span className="ml-2 text-[#0A84FF]">• Shuffled</span>}
            </p>
          )}
        </div>
        <span className="text-sm text-zinc-500">{playlistQueue.length} songs</span>
      </div>

      <div className="max-h-[400px] overflow-y-auto pr-1">
        {playlistQueue.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-4">All songs have been played</p>
        ) : (
          <Reorder.Group 
            axis="y" 
            values={playlistQueue} 
            onReorder={handleReorder} 
            className="space-y-2"
          >
            {playlistQueue.map((item, index) => {
              // item is now QueueItem { id, songId, addedBy }
              const song = getSongById(item.songId);
              if (!song) return null;

              return (
                <Reorder.Item
                  key={item.id}
                  value={item}
                  dragListener={isHost} // Only host can drag
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={() => setTimeout(() => setIsDragging(false), 200)}
                  className={`flex items-center gap-3 rounded-xl p-2.5 transition border border-white/5 bg-white/5 hover:bg-white/10 ${
                    (isHost || !roomCode) ? "cursor-pointer" : ""
                  }`}
                  onClick={() => handlePlayFromQueue(index, song.id)}
                >
                  <div className="flex w-5 justify-center shrink-0">
                    {isHost ? (
                      <GripVertical size={14} className="text-zinc-600 cursor-grab active:cursor-grabbing hover:text-white transition" />
                    ) : (
                      <span className="text-xs text-zinc-600">{index + 1}</span>
                    )}
                  </div>

                  <Image
                    src={song.cover || "/default-cover.png"}
                    alt={song.title}
                    width={36}
                    height={36}
                    className="rounded-lg shrink-0 pointer-events-none"
                  />

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium truncate text-white">
                      {song.title}
                    </h3>
                    <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                    {item.addedBy && (
                      <p className="text-[10px] text-[#0A84FF] mt-0.5 font-medium truncate">Added by {item.addedBy}</p>
                    )}
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        )}
      </div>
    </GlassCard>
  );
}
