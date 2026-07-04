"use client";

import { useState, useMemo } from "react";
import GlassCard from "../ui/GlassCard";
import SearchBar from "../search/SearchBar";
import { useSongStore } from "@/store/songStore";
import { useRoomStore } from "@/store/roomStore";
import useSocket from "@/hooks/useSocket";
import Image from "next/image";
import { Plus, Edit2, Check, X, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { usePlaylistStore } from "@/store/playlistStore";

export default function SearchSongs() {
  const [search, setSearch] = useState("");
  const { songs, fetchSongs } = useSongStore();
  const { hostId, userId, roomCode, queue } = useRoomStore();
  const socket = useSocket();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { playlists, addSongToPlaylist } = usePlaylistStore();
  const [selectingPlaylistFor, setSelectingPlaylistFor] = useState<string | null>(null);

  const isHost = userId === hostId && hostId !== null;

  const filteredSongs = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return [];
    
    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        (song as any).album?.toLowerCase().includes(query)
    ).slice(0, 5); // Limit to top 5 results for compactness
  }, [search, songs]);

  const handleAddToQueue = (songId: string) => {
    const isAlreadyInQueue = queue.some(item => item.songId === songId && item.addedBy !== "System");
    if (isAlreadyInQueue) {
      toast.error("Song is already in the queue");
      return;
    }

    socket.emit("add-to-queue", { roomCode, songId, memberId: userId });
    setSearch(""); // clear after adding
    toast.success("Added to queue");
  };

  const handleAddToPlaylist = (playlistId: string, songId: string) => {
    addSongToPlaylist(playlistId, songId);
    toast.success("Added to playlist");
    setSelectingPlaylistFor(null);
  };

  const startEditing = (song: any) => {
    setEditingId(song.id);
    setEditTitle(song.title);
    setEditArtist(song.artist);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/songs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, artist: editArtist })
      });
      if (res.ok) {
        toast.success("Song updated successfully");
        await fetchSongs();
        setEditingId(null);
      } else {
        toast.error("Failed to update song");
      }
    } catch (e) {
      toast.error("Error updating song");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <h2 className="mb-4 text-xl font-semibold">Search Songs</h2>
      <SearchBar value={search} onChange={setSearch} />

      {filteredSongs.length > 0 && (
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          {filteredSongs.map((song) => (
            <div
              key={song.id}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-2 transition-colors hover:bg-white/10"
            >
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <Image
                  src={song.cover || "/default-cover.png"}
                  alt={song.title}
                  width={40}
                  height={40}
                  className="rounded-lg shrink-0"
                />
                
                {editingId === song.id ? (
                  <div className="flex flex-col gap-1 w-full mr-2">
                    <input 
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white"
                      placeholder="Title"
                      autoFocus
                    />
                    <input 
                      value={editArtist}
                      onChange={(e) => setEditArtist(e.target.value)}
                      className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-zinc-300"
                      placeholder="Artist"
                    />
                  </div>
                ) : (
                  <div className="truncate">
                    <h4 className="text-sm font-medium truncate">{song.title}</h4>
                    <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center">
                {editingId === song.id ? (
                  <>
                    <button onClick={() => saveEdit(song.id)} disabled={isSaving} className="p-2 text-green-400 hover:text-green-300 transition-colors">
                      <Check size={16} />
                    </button>
                    <button onClick={cancelEditing} disabled={isSaving} className="p-2 text-red-400 hover:text-red-300 transition-colors">
                      <X size={16} />
                    </button>
                  </>
                ) : selectingPlaylistFor === song.id ? (
                  <div className="flex flex-col gap-1 w-32 relative">
                    <div className="absolute right-0 top-0 bg-[#1a1a1a] border border-white/10 rounded-lg p-2 shadow-2xl z-10 w-48 max-h-48 overflow-y-auto">
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                        <span className="text-xs text-zinc-400 font-semibold">Select Playlist</span>
                        <button onClick={() => setSelectingPlaylistFor(null)} className="text-zinc-500 hover:text-white"><X size={14}/></button>
                      </div>
                      {playlists.length === 0 ? (
                        <p className="text-xs text-zinc-500 text-center py-2">No playlists</p>
                      ) : (
                        playlists.map(p => (
                          <button 
                            key={p.id} 
                            onClick={() => handleAddToPlaylist(p.id, song.id)}
                            className="w-full text-left text-sm py-1.5 px-2 rounded hover:bg-white/10 truncate transition-colors"
                          >
                            {p.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectingPlaylistFor(song.id)}
                      className="p-2 text-zinc-400 hover:text-white transition-colors"
                      title="Add to Playlist"
                    >
                      <FolderPlus size={16} />
                    </button>
                    <button
                      onClick={() => startEditing(song)}
                      className="p-2 text-zinc-400 hover:text-white transition-colors"
                      title="Edit Song"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleAddToQueue(song.id)}
                      className="p-2 text-zinc-400 hover:text-white transition-colors"
                      title="Add to Queue"
                    >
                      <Plus size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
