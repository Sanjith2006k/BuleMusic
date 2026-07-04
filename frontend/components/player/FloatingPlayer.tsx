"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { usePlaybackStore } from "@/store/playbackStore";
import { useSongStore } from "@/store/songStore";
import { useState, useEffect } from "react";
import { Edit2, Check, X, ListMusic } from "lucide-react";
import { toast } from "sonner";

import GlassCard from "../ui/GlassCard";
import PlayerControls from "./PlayerControls";
import ProgressBar from "./ProgressBar";
import AllSongsModal from "../modal/AllSongsModal";

export default function FloatingPlayer() {
  const playing = usePlaybackStore((state) => state.playing);
  const songId = usePlaybackStore((state) => state.songId);
  const fetchSongs = useSongStore((state) => state.fetchSongs);
  const getSongById = useSongStore((state) => state.getSongById);

  const song = songId ? getSongById(songId) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [showAllSongs, setShowAllSongs] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (song) {
      setEditTitle(song.title);
      setEditArtist(song.artist);
    }
  }, [song]);

  const handleEditSubmit = async () => {
    if (!editTitle.trim() || !song) return;
    setIsSaving(true);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/songs/${song.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, artist: editArtist }),
      });

      if (!res.ok) throw new Error("Failed to update song");

      await fetchSongs();
      toast.success("Song updated!");
      setIsEditing(false);
    } catch (err) {
      toast.error("Could not update song");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed bottom-0 lg:bottom-6 left-0 lg:left-1/2 z-50 w-full lg:w-[95%] lg:max-w-6xl lg:-translate-x-1/2">
      <GlassCard className="rounded-none lg:rounded-3xl border-t lg:border border-white/10 bg-black/60 lg:bg-white/5 p-3 lg:p-5 backdrop-blur-3xl relative">
        
        {/* Mobile top-edge progress bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 lg:hidden">
          <div 
            className="h-full bg-[#0A84FF]" 
            style={{ width: `${usePlaybackStore.getState().duration > 0 ? (usePlaybackStore.getState().uiCurrentTime / usePlaybackStore.getState().duration) * 100 : 0}%` }}
          />
        </div>

        <div className="flex items-center justify-between lg:grid lg:items-center lg:gap-6 lg:grid-cols-[280px_1fr_220px]">
          {/* Song Info */}
          <div className="flex items-center gap-3 lg:gap-4 min-w-0 overflow-hidden flex-1 lg:flex-none">
            <motion.div
              className="shrink-0"
              animate={{
                rotate: playing ? 360 : 0,
              }}
              transition={{
                duration: 15,
                repeat: playing ? Infinity : 0,
                ease: "linear",
              }}
            >
              <Image
                src={song?.cover || "/default-cover.png"}
                alt={song?.title || "Album"}
                width={48}
                height={48}
                className="rounded-xl lg:rounded-2xl lg:w-[56px] lg:h-[56px]"
              />
            </motion.div>

            <div className="min-w-0 flex-1 overflow-hidden group">
              {isEditing ? (
                <div className="flex flex-col gap-1 w-full">
                  <input
                    type="text"
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleEditSubmit()}
                    className="w-full bg-black/40 text-sm font-semibold text-white outline-none border border-white/20 rounded px-2 py-1"
                    placeholder="Title"
                  />
                  <div className="flex gap-1 items-center">
                    <input
                      type="text"
                      value={editArtist}
                      onChange={(e) => setEditArtist(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleEditSubmit()}
                      className="flex-1 bg-black/40 text-xs text-zinc-300 outline-none border border-white/20 rounded px-2 py-1"
                      placeholder="Artist"
                    />
                    <button onClick={handleEditSubmit} disabled={isSaving} className="text-green-400 hover:text-green-300 p-1 shrink-0">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setIsEditing(false)} disabled={isSaving} className="text-red-400 hover:text-red-300 p-1 shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white text-sm truncate">
                      {song ? song.title : "Not Playing"}
                    </h3>
                    <p className="text-xs text-zinc-400 truncate">
                      {song ? song.artist : "Select a song"}
                    </p>
                  </div>
                  {song && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="hidden lg:block text-zinc-400 hover:text-white p-1 shrink-0 transition-colors"
                      title="Edit song info"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Controls - Hidden on mobile, Mobile Play Button Instead */}
          <div className="hidden lg:block">
            <div className="mb-4 flex justify-center">
              <PlayerControls />
            </div>
            <ProgressBar />
          </div>

          {/* Mobile Full Controls (Play/Pause, Next, Prev, Shuffle) */}
          <div className="lg:hidden ml-2 shrink-0">
            <PlayerControls mobileOnly />
          </div>

          {/* Actions */}
          <div className="hidden lg:flex justify-end items-center">
            <button
              onClick={() => setShowAllSongs(true)}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition"
            >
              <ListMusic size={16} />
              Show All Songs
            </button>
          </div>
        </div>
      </GlassCard>

      <AllSongsModal open={showAllSongs} onClose={() => setShowAllSongs(false)} />
    </div>
  );
}
