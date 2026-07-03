"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import GlassCard from "../ui/GlassCard";
import Waveform from "../player/Waveform";
import { usePlaybackStore } from "@/store/playbackStore";
import { useSongStore } from "@/store/songStore";

export default function NowPlaying() {
  const playing = usePlaybackStore((state) => state.playing);
  const songId = usePlaybackStore((state) => state.songId);
  const getSongById = useSongStore((state) => state.getSongById);
  const fetchSongs = useSongStore((state) => state.fetchSongs);

  const song = songId ? getSongById(songId) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    if (song) setEditTitle(song.title);
  }, [song]);

  const handleEditSubmit = async () => {
    setIsEditing(false);
    if (editTitle.trim() === "" || !song || editTitle === song.title) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/songs/${song.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle }),
      });

      if (!res.ok) throw new Error("Failed to update song");

      // Refresh global store
      await fetchSongs();
      toast.success("Song title updated!");
    } catch (err) {
      toast.error("Could not update song name");
    }
  };

  return (
    <>
      <GlassCard className="relative overflow-hidden p-6 md:p-10">
        {/* Blue Glow */}
        <div className="absolute left-1/2 top-36 h-72 w-72 -translate-x-1/2 rounded-full bg-[#0A84FF]/20 blur-[120px]" />

        <motion.div
          animate={{
            rotate: playing ? 360 : 0,
          }}
          transition={{
            duration: 20,
            repeat: playing ? Infinity : 0,
            ease: "linear",
          }}
          className="relative mx-auto w-48 h-48 md:w-80 md:h-80"
        >
          <Image
            src={song?.cover || "/default-cover.png"}
            alt={song?.title || "Album"}
            fill
            sizes="(max-width: 768px) 192px, 320px"
            className="rounded-full shadow-2xl object-cover"
            priority
          />
        </motion.div>

        <div className="relative mt-6 md:mt-10 text-center w-full px-2 md:px-4">
          {isEditing ? (
            <input
              type="text"
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleEditSubmit()}
              className="w-full bg-transparent text-center text-2xl md:text-5xl font-bold outline-none border-b border-white/20 break-words"
            />
          ) : (
            <h2 
              className="text-2xl md:text-5xl font-bold cursor-text hover:text-[#0A84FF] transition-colors break-words w-full"
              onClick={() => {
                if (song) setIsEditing(true);
              }}
              title="Click to edit"
              style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
            >
              {song ? song.title : "No Song Selected"}
            </h2>
          )}

          <p className="mt-2 md:mt-3 text-lg md:text-xl text-zinc-400">{song ? song.artist : "Search and add a song to start"}</p>

          <Waveform />
        </div>
      </GlassCard>
    </>
  );
}
