"use client";

import GlassCard from "../ui/GlassCard";
import { useRoomStore } from "@/store/roomStore";
import { useSongStore } from "@/store/songStore";
import { usePlaybackStore } from "@/store/playbackStore";
import { usePlaylistStore } from "@/store/playlistStore";
import { usePlayerStore } from "@/store/playerStore";
import Image from "next/image";
import { Play, Shuffle, Plus } from "lucide-react";
import useSocket from "@/hooks/useSocket";
import useAudio from "@/hooks/useAudio";
import { toast } from "sonner";

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

  const activePlaylist = activePlaylistId ? playlists.find(p => p.id === activePlaylistId) : null;

  const handlePlayFromQueue = (index: number, songId: string) => {
    if (!isHost && roomCode) return;

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
        updatedAt: Date.now() 
      });
    }
  };

  const userQueue = playlistQueue.filter((item) => item.addedBy !== "System");
  const systemQueue = playlistQueue.filter((item) => item.addedBy === "System");

  const handleAddToQueue = (e: React.MouseEvent, songId: string, title: string) => {
    e.stopPropagation(); // Prevent triggering handlePlayFromQueue
    if (roomCode) {
      socket.emit("add-to-queue", { roomCode, songId, memberId: userId });
      toast.success(`Added ${title} to queue`);
    } else {
      toast.error("You must be in a party to add to queue.");
    }
  };

  const renderQueueItem = (item: any, globalIndex: number) => {
    const song = getSongById(item.songId);
    if (!song) return null;

    return (
      <div
        key={item.id}
        className={`flex items-center gap-3 rounded-xl p-2.5 transition border border-white/5 bg-white/5 hover:bg-white/10 cursor-pointer`}
        onClick={() => handlePlayFromQueue(globalIndex, song.id)}
      >
        <div className="flex w-5 justify-center shrink-0">
          <span className="text-xs text-zinc-600">{globalIndex + 1}</span>
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
          {item.addedBy && item.addedBy !== "System" && (
            <p className="text-[10px] text-[#0A84FF] mt-0.5 font-medium truncate">Added by {item.addedBy}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={(e) => handleAddToQueue(e, song.id, song.title)}
            className="p-2 text-zinc-400 hover:text-white transition rounded-full hover:bg-white/10 shrink-0"
            title="Add to Queue"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Up Next</h2>
        </div>
        <span className="text-sm text-zinc-500">{playlistQueue.length} songs</span>
      </div>

      <div className="max-h-[400px] overflow-y-auto pr-1 space-y-6">
        {playlistQueue.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-4">All songs have been played</p>
        ) : (
          <>
            {userQueue.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Next in queue</h3>
                <div className="space-y-2">
                  {userQueue.map((item, index) => renderQueueItem(item, index))}
                </div>
              </div>
            )}

            {systemQueue.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                  Next from: <span className="text-white">{activePlaylist ? activePlaylist.name : 'Playlist'}</span>
                  {shuffle && <span className="text-[#0A84FF] text-xs font-normal bg-[#0A84FF]/10 px-2 py-0.5 rounded-full">Shuffled</span>}
                </h3>
                <div className="space-y-2">
                  {systemQueue.map((item, index) => renderQueueItem(item, userQueue.length + index))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </GlassCard>
  );
}
