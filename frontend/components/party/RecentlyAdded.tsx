"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import GlassCard from "../ui/GlassCard";
import { useSongStore } from "@/store/songStore";
import { useRoomStore } from "@/store/roomStore";
import useSocket from "@/hooks/useSocket";

export default function RecentlyAdded() {
  const { songs } = useSongStore();
  const { userId, roomCode } = useRoomStore();
  const socket = useSocket();

  const recentSongs = useMemo(() => {
    // Sort songs by createdAt descending, grab top 10
    return [...songs]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [songs]);

  const handleAddToQueue = (songId: string, title: string) => {
    if (roomCode) {
      socket.emit("add-to-queue", { roomCode, songId, memberId: userId });
      toast.success(`Added ${title} to queue`);
    } else {
      toast.error("You must be in a party to add to queue.");
    }
  };

  if (recentSongs.length === 0) return null;

  return (
    <GlassCard className="p-6 mb-6">
      <h2 className="mb-4 text-xl font-semibold">Recently Added</h2>
      
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
        {recentSongs.map((song) => (
          <div 
            key={song.id} 
            className="flex flex-col gap-2 min-w-[120px] max-w-[120px] snap-start"
          >
            <div className="relative group">
              <Image
                src={song.cover || "/default-cover.png"}
                alt={song.title}
                width={120}
                height={120}
                className="rounded-xl aspect-square object-cover"
              />
              <button
                onClick={() => handleAddToQueue(song.id, song.title)}
                className="absolute bottom-2 right-2 p-2 bg-black/60 hover:bg-white/20 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg backdrop-blur-sm border border-white/10"
                title="Add to Queue"
              >
                <Plus size={18} />
              </button>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white truncate" title={song.title}>
                {song.title}
              </h3>
              <p className="text-[10px] text-zinc-400 truncate" title={song.artist}>
                {song.artist}
              </p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
