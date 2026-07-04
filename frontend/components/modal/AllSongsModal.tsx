"use client";

import { useSongStore } from "@/store/songStore";
import { useRoomStore } from "@/store/roomStore";
import { usePlaybackStore } from "@/store/playbackStore";
import useAudio from "@/hooks/useAudio";
import useSocket from "@/hooks/useSocket";
import Modal from "./Modal";
import Image from "next/image";
import { Play, Plus, Shuffle, RefreshCw, ListPlus, ListEnd } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AllSongsModal({ open, onClose }: Props) {
  const songs = useSongStore((state) => state.songs);
  const refreshSongs = useSongStore((state) => state.refreshSongs);
  const isLoading = useSongStore((state) => state.isLoading);
  const { userId, hostId, roomCode } = useRoomStore();
  const socket = useSocket();
  const { play } = useAudio();

  const isHost = userId === hostId && hostId !== null;

  const handlePlaySong = (songId: string) => {
    if (!isHost && roomCode) return;

    if (roomCode) {
      socket.emit("play", {
        roomCode,
        currentTime: 0,
        songId: songId
      });
      // The host will receive the updated playback-state from the backend instantly,
      // which has the correct startedAt timestamp. This prevents latency desyncs.
    } else {
      // Offline mode
      usePlaybackStore.setState({ 
        songId: songId, 
        playing: true, 
        currentTime: 0, 
        updatedAt: Date.now() 
      });
    }
    
    onClose();
  };

  const handlePlayNext = (e: React.MouseEvent, songId: string, title: string) => {
    e.stopPropagation();
    if (roomCode) {
      socket.emit("play-next-queue", { roomCode, songId, memberId: userId });
      toast.success(`Playing ${title} next`);
    } else {
      toast.error("You must be in a party to use Play Next.");
    }
  };

  const handleAddToQueue = (e: React.MouseEvent, songId: string, title: string) => {
    e.stopPropagation(); // Prevent triggering handlePlaySong
    if (roomCode) {
      socket.emit("add-to-queue", { roomCode, songId, memberId: userId });
      toast.success(`Added ${title} to queue`);
    } else {
      toast.error("You must be in a party to add to queue.");
    }
  };

  const handleShufflePlayAll = () => {
    if (!isHost && roomCode) return;
    if (songs.length === 0) return;

    let songsToQueue = songs.map(s => s.id);
    // Fisher-Yates shuffle
    for (let i = songsToQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [songsToQueue[i], songsToQueue[j]] = [songsToQueue[j], songsToQueue[i]];
    }

    const upcomingItems = songsToQueue.slice(1).map((id, idx) => ({
      id: `${id}-${idx}-${Date.now()}`,
      songId: id,
      addedBy: "System"
    }));

    // For "All Songs", we can clear the active playlist ID so it doesn't try to unshuffle to a playlist
    useRoomStore.getState().setActivePlaylistId(null);
    useRoomStore.getState().setPlaylistQueue(upcomingItems);

    if (roomCode && isHost) {
      socket.emit("set-queue", { roomCode, queue: upcomingItems });
      socket.emit("play", {
        roomCode,
        currentTime: 0,
        songId: songsToQueue[0]
      });
      usePlaybackStore.setState({ songId: songsToQueue[0], playing: true, updatedAt: Date.now() });
    } else if (!roomCode) {
      usePlaybackStore.setState({ songId: songsToQueue[0], playing: true, currentTime: 0, updatedAt: Date.now() });
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="All Songs">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-zinc-400">{songs.length} songs</span>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={async () => {
              const newCount = await refreshSongs();
              if (newCount > 0) {
                toast.success(`Found ${newCount} new song${newCount > 1 ? 's' : ''} from AWS!`);
              } else {
                toast.info('No new songs found. All songs are up to date.');
              }
            }}
            disabled={isLoading}
            className={`flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition shadow-sm ${isLoading ? 'opacity-50' : ''}`}
            title="Scan AWS for new songs"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Scanning...' : 'Reload'}
          </button>

          {(!roomCode || isHost) && songs.length > 0 && (
            <button 
              onClick={handleShufflePlayAll}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition shadow-sm"
            >
              <Shuffle size={14} />
              Shuffle All
            </button>
          )}
        </div>
      </div>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
        {songs.map((song) => (
          <div
            key={song.id}
            onClick={() => handlePlaySong(song.id)}
            className={`flex items-center gap-3 rounded-xl p-3 transition border border-white/5 bg-white/5 hover:bg-white/10 ${
              (isHost || !roomCode) ? "cursor-pointer" : ""
            }`}
          >
            <div className="flex w-6 justify-center shrink-0">
              <Play size={14} className="text-zinc-500 hover:text-white" />
            </div>

            <Image
              src={song.cover || "/default-cover.png"}
              alt={song.title}
              width={40}
              height={40}
              className="rounded-lg shrink-0"
            />

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium truncate text-white">
                {song.title}
              </h3>
              <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={(e) => handlePlayNext(e, song.id, song.title)}
                className="p-2 text-zinc-400 hover:text-white transition rounded-full hover:bg-white/10"
                title="Play Next"
              >
                <ListPlus size={16} />
              </button>
              <button 
                onClick={(e) => handleAddToQueue(e, song.id, song.title)}
                className="p-2 text-zinc-400 hover:text-white transition rounded-full hover:bg-white/10"
                title="Add to end of Queue"
              >
                <ListEnd size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
