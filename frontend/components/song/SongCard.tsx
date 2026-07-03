"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

import type { Song } from "@/types/song";
import { formatDuration } from "@/utils/formatDuration";
import GlassCard from "../ui/GlassCard";

import { usePlaybackStore } from "@/store/playbackStore";
import { useRoomStore } from "@/store/roomStore";
import { usePlaylistStore } from "@/store/playlistStore";
import useSocket from "@/hooks/useSocket";
import useAudio from "@/hooks/useAudio";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface Props {
  song: Song;
}

export default function SongCard({ song }: Props) {
  const { hostId, userId, roomCode } = useRoomStore();
  const playlists = usePlaylistStore(state => state.playlists);
  const addSongToPlaylist = usePlaylistStore(state => state.addSongToPlaylist);
  const socket = useSocket();
  const { play } = useAudio();
  const isHost = userId === hostId && hostId !== null;
  const inRoom = roomCode !== null;

  const handleClick = (e: React.MouseEvent) => {
    // If they clicked the select dropdown, don't trigger the main click
    if ((e.target as HTMLElement).tagName === 'SELECT') return;

    if (inRoom) {
      if (isHost) {
        socket.emit("add-to-queue", { roomCode, songId: song.id });
        toast.success(`Added ${song.title} to queue`);
      } else {
        toast.error("Only the host can add songs to the queue");
      }
    } else {
      // Local play
      usePlaybackStore.setState({ songId: song.id, playing: true });
      // Small delay to let audio element update src before calling play()
      setTimeout(play, 100);
    }
  };

  const handleAddToPlaylist = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const playlistId = e.target.value;
    if (playlistId) {
      addSongToPlaylist(playlistId, song.id);
      toast.success(`Added to playlist`);
      e.target.value = ""; // Reset select
    }
  };

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <GlassCard 
        className="group flex cursor-pointer items-center gap-5 p-4 transition-all hover:bg-white/10"
        onClick={handleClick}
      >
        <div className="relative h-20 w-20 overflow-hidden rounded-2xl">
          <Image
            src={song.cover || "/default-cover.png"}
            alt={song.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-110"
          />

          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
            <Play className="fill-white" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold">{song.title}</h3>

          <p className="text-sm text-zinc-400">{song.artist}</p>
        </div>

        <div className="flex items-center gap-4">
          {!inRoom && playlists.length > 0 && (
            <select 
              className="bg-transparent text-sm text-zinc-400 focus:outline-none cursor-pointer hover:text-white transition"
              onChange={handleAddToPlaylist}
              defaultValue=""
            >
              <option value="" disabled>+ Add to Playlist</option>
              {playlists.map(p => (
                <option key={p.id} value={p.id} className="bg-[#090909] text-white">
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <span className="text-zinc-500">{formatDuration(song.duration)}</span>
        </div>
      </GlassCard>
    </motion.div>
  );
}
