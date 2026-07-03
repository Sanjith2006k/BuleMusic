"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import Modal from "./Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useSongStore } from "@/store/songStore";
import { usePlaylistStore } from "@/store/playlistStore";
import Image from "next/image";
import { Check } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreatePlaylistModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  
  const songs = useSongStore(state => state.songs);
  const { createPlaylist, addSongToPlaylist, playlists } = usePlaylistStore();

  const filteredSongs = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return songs;
    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
    );
  }, [search, songs]);

  const toggleSong = (songId: string) => {
    const newSet = new Set(selectedSongs);
    if (newSet.has(songId)) newSet.delete(songId);
    else newSet.add(songId);
    setSelectedSongs(newSet);
  };

  const handleCreate = () => {
    if (!name.trim()) return toast.error("Please enter a playlist name");
    if (selectedSongs.size === 0) return toast.error("Please select at least one song");

    createPlaylist(name, Array.from(selectedSongs));
    toast.success("Playlist created!");
    setName("");
    setSelectedSongs(new Set());
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Playlist">
      <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-2">
        <Input
          placeholder="Playlist Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="pt-2">
          <h3 className="text-sm font-semibold text-zinc-400 mb-2">Select Songs ({selectedSongs.size} selected)</h3>
          <Input 
            placeholder="Search songs..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4"
          />
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredSongs.map((song) => {
              const isSelected = selectedSongs.has(song.id);
              return (
                <div 
                  key={song.id}
                  onClick={() => toggleSong(song.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-2 transition-colors ${
                    isSelected ? "border-[#0A84FF] bg-[#0A84FF]/10" : "border-white/5 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={song.cover || "/default-cover.png"}
                      alt={song.title}
                      width={40}
                      height={40}
                      className="rounded-lg object-cover"
                    />
                    <div className="text-left">
                      <h4 className="text-sm font-medium text-white">{song.title}</h4>
                      <p className="text-xs text-zinc-400">{song.artist}</p>
                    </div>
                  </div>
                  {isSelected && <Check size={18} className="text-[#0A84FF] mr-2" />}
                </div>
              );
            })}
          </div>
        </div>

        <Button className="w-full" onClick={handleCreate}>
          Create Playlist
        </Button>
      </div>
    </Modal>
  );
}
