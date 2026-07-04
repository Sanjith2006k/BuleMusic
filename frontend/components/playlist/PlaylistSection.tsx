"use client";

import { useState, useEffect, useMemo } from "react";
import { usePlaylistStore } from "@/store/playlistStore";
import { useSongStore } from "@/store/songStore";
import { usePlaybackStore } from "@/store/playbackStore";
import useAudio from "@/hooks/useAudio";
import GlassCard from "../ui/GlassCard";
import Button from "../ui/Button";
import Modal from "../modal/Modal";
import { ListMusic, Trash2, Play, Shuffle, Plus } from "lucide-react";
import CreatePlaylistModal from "../modal/CreatePlaylistModal";
import { useRoomStore } from "@/store/roomStore";
import useSocket from "@/hooks/useSocket";

export default function PlaylistSection() {
  const [isMounted, setIsMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null);
  const { playlists, deletePlaylist, removeSongFromPlaylist, addSongToPlaylist } = usePlaylistStore();
  const { songs, getSongById } = useSongStore();
  const { play } = useAudio();
  const { roomCode, hostId, userId, setActivePlaylistId, setPlaylistQueue } = useRoomStore();
  const socket = useSocket();

  const isHost = userId === hostId && hostId !== null;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handlePlayPlaylist = (playlistId: string, shuffle: boolean = false) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist || playlist.songIds.length === 0) return;

    let songsToQueue = [...playlist.songIds];
    if (shuffle) {
      // Fisher-Yates shuffle
      for (let i = songsToQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [songsToQueue[i], songsToQueue[j]] = [songsToQueue[j], songsToQueue[i]];
      }
    }

    const upcomingItems = songsToQueue.slice(1).map((id, idx) => ({
      id: `${id}-${idx}-${Date.now()}`,
      songId: id,
      addedBy: "System"
    }));

    // Store the ordered list locally for "Up Next" display, excluding the first song which plays immediately
    setActivePlaylistId(playlistId);
    setPlaylistQueue(upcomingItems);

    if (roomCode) {
      // Set the upcoming queue in backend
      socket.emit("set-queue", { roomCode, queue: upcomingItems });
      
      // Force play the first song immediately
      socket.emit("play", {
        roomCode,
        currentTime: 0,
        songId: songsToQueue[0]
      });
      // Force local playback instantly for the member who clicked
      usePlaybackStore.setState({ songId: songsToQueue[0], playing: true });
      usePlayerStore.getState().setShuffle(true);
    } else {
      usePlaybackStore.setState({ songId: songsToQueue[0], playing: true });
      usePlayerStore.getState().setShuffle(false);
    }
    setTimeout(play, 100);
  };

  // All songs NOT in the expanded playlist — shown directly, no search needed
  const songsNotInPlaylist = useMemo(() => {
    if (!expandedPlaylistId) return [];
    const playlist = playlists.find(p => p.id === expandedPlaylistId);
    if (!playlist) return [];
    return songs.filter(s => !playlist.songIds.includes(s.id));
  }, [expandedPlaylistId, playlists, songs]);

  if (!isMounted) {
    return null;
  }

  const expandedPlaylist = expandedPlaylistId ? playlists.find(p => p.id === expandedPlaylistId) : null;

  return (
    <div className="mb-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Your Playlists</h2>
          <p className="text-sm text-zinc-400">Custom collections</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Create Playlist</Button>
      </div>

      {playlists.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 border-white/10">
          <ListMusic size={48} className="mb-4 text-zinc-600" />
          <h3 className="mb-2 text-xl font-semibold">No playlists yet</h3>
          <p className="text-zinc-400 mb-6 max-w-md">Create your first playlist and start organizing your favorite songs.</p>
          <Button variant="secondary" onClick={() => setModalOpen(true)}>Create Playlist</Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {playlists.map(playlist => (
            <GlassCard key={playlist.id} className="p-5 flex flex-col justify-between cursor-pointer hover:bg-white/10 transition" onClick={() => setExpandedPlaylistId(playlist.id)}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-white">
                    <ListMusic size={20} />
                    <span className="text-sm text-zinc-400">{playlist.songIds.length} songs</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handlePlayPlaylist(playlist.id); }} className="text-white hover:text-[#0A84FF] transition" title="Play Now"><Play size={18} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handlePlayPlaylist(playlist.id, true); }} className="text-white hover:text-[#0A84FF] transition" title="Shuffle Play"><Shuffle size={18} /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg truncate flex-1 mr-2">{playlist.name}</h3>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deletePlaylist(playlist.id); }}
                    className="text-zinc-500 hover:text-red-400 transition shrink-0"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <CreatePlaylistModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {expandedPlaylist && (
        <Modal open={true} onClose={() => setExpandedPlaylistId(null)} title={expandedPlaylist.name}>
          {/* Header with play/shuffle */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-zinc-400">{expandedPlaylist.songIds.length} songs</span>
            <div className="flex gap-2">
              <button 
                onClick={() => handlePlayPlaylist(expandedPlaylist.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A84FF] transition hover:scale-105"
                title="Play"
              >
                <Play fill="white" size={14} />
              </button>
              <button 
                onClick={() => handlePlayPlaylist(expandedPlaylist.id, true)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition hover:scale-105"
                title="Shuffle"
              >
                <Shuffle size={14} />
              </button>
            </div>
          </div>

          {/* Songs in playlist */}
          <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1 mb-4">
            {expandedPlaylist.songIds.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-4">This playlist is empty. Add songs from below.</p>
            ) : (
              expandedPlaylist.songIds.map((songId, index) => {
                const song = getSongById(songId);
                if (!song) return null;
                return (
                  <div key={`${songId}-${index}`} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-2 hover:bg-white/10 transition">
                    <img src={song.cover || "/default-cover.png"} alt={song.title} className="w-10 h-10 rounded-lg shrink-0 object-cover" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm text-white truncate">{song.title}</h4>
                      <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                    </div>
                    <button 
                      onClick={() => removeSongFromPlaylist(expandedPlaylist.id, songId)}
                      className="text-zinc-500 hover:text-red-400 p-1.5 shrink-0 transition"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* All songs not in playlist */}
          <div className="border-t border-white/10 pt-4">
            <h4 className="text-sm font-semibold text-zinc-300 mb-3">Add Songs</h4>
            <div className="space-y-1 max-h-[25vh] overflow-y-auto pr-1">
              {songsNotInPlaylist.length === 0 ? (
                <p className="text-zinc-600 text-xs text-center py-3">All songs are already in this playlist</p>
              ) : (
                songsNotInPlaylist.map(song => (
                  <div key={song.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/5 transition">
                    <img src={song.cover || "/default-cover.png"} alt={song.title} className="w-8 h-8 rounded-md shrink-0 object-cover" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm text-white truncate">{song.title}</h4>
                      <p className="text-xs text-zinc-500 truncate">{song.artist}</p>
                    </div>
                    <button
                      onClick={() => addSongToPlaylist(expandedPlaylist.id, song.id)}
                      className="text-zinc-500 hover:text-[#0A84FF] p-1 shrink-0 transition"
                      title="Add to playlist"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
