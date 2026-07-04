"use client";

import { useSongStore } from "@/store/songStore";
import { useRoomStore } from "@/store/roomStore";
import { usePlaybackStore } from "@/store/playbackStore";
import useSocket from "@/hooks/useSocket";
import Image from "next/image";
import { Play, Plus } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Song } from "@/store/songStore";

export default function NewlyAddedSongs() {
  const songs = useSongStore((state) => state.songs);
  const { userId, hostId, roomCode, queue } = useRoomStore();
  const socket = useSocket();
  const isHost = userId === hostId && hostId !== null;

  const [recentSongs, setRecentSongs] = useState<Song[]>([]);

  useEffect(() => {
    // Assuming newer songs are added at the end of the list. We'll take the last 8 songs and reverse them.
    if (songs.length > 0) {
      const latest = [...songs].slice(-8).reverse();
      setRecentSongs(latest);
    }
  }, [songs]);

  const handlePlaySong = (songId: string) => {
    if (!isHost && roomCode) return;

    if (roomCode) {
      socket.emit("play", {
        roomCode,
        currentTime: 0,
        songId: songId
      });
    } else {
      // Offline mode
      usePlaybackStore.setState({ 
        songId: songId, 
        playing: true, 
        currentTime: 0, 
        updatedAt: Date.now() 
      });
    }
  };

  const handleAddToQueue = (e: React.MouseEvent, songId: string, title: string) => {
    e.stopPropagation();
    if (roomCode) {
      const isAlreadyInQueue = queue.some(item => item.songId === songId);
      if (isAlreadyInQueue) {
        toast.error("Song is already in the queue");
        return;
      }

      socket.emit("add-to-queue", { roomCode, songId, memberId: userId });
      toast.success(`Added ${title} to queue`);
    } else {
      toast.error("You must be in a party to add to queue.");
    }
  };

  if (recentSongs.length === 0) return null;

  return (
    <section className="py-12">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white tracking-tight">Newly Added Songs</h2>
        <span className="text-sm font-medium text-zinc-400 bg-white/5 px-3 py-1 rounded-full">
          Fresh off AWS
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
        {recentSongs.map((song) => (
          <div
            key={song.id}
            onClick={() => handlePlaySong(song.id)}
            className={`group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-4 transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 ${
              (isHost || !roomCode) ? "cursor-pointer" : "opacity-75 cursor-not-allowed"
            }`}
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black/50 mb-4 shadow-md">
              <Image
                src={song.cover || "/default-cover.png"}
                alt={song.title}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              
              {/* Play overlay overlay */}
              {(isHost || !roomCode) && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <div className="bg-[#0A84FF] rounded-full p-3 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-lg shadow-[#0A84FF]/40">
                    <Play fill="white" size={20} className="ml-1 text-white" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white truncate group-hover:text-[#0A84FF] transition-colors">
                  {song.title}
                </h3>
                <p className="text-sm text-zinc-400 truncate mt-1">
                  {song.artist}
                </p>
              </div>
              <button 
                onClick={(e) => handleAddToQueue(e, song.id, song.title)}
                className="shrink-0 p-2 text-zinc-400 hover:text-white transition rounded-full hover:bg-white/10 opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0"
                title="Add to Queue"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
