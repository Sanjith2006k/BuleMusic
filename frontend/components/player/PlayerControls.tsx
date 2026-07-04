"use client";

import {
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Shuffle,
  Repeat2,
} from "lucide-react";

import { usePlayerStore } from "@/store/playerStore";
import { usePlaybackStore } from "@/store/playbackStore";
import { useRoomStore } from "@/store/roomStore";
import { usePlaylistStore } from "@/store/playlistStore";
import useAudio from "@/hooks/useAudio";
import useSocket from "@/hooks/useSocket";

export default function PlayerControls({ mobileOnly = false }: { mobileOnly?: boolean }) {
  const { shuffle, repeat, toggleShuffle, toggleRepeat } = usePlayerStore();
  const { playing, songId: currentSongId } = usePlaybackStore();
  const { userId, hostId, roomCode, activePlaylistId, playlistQueue, setPlaylistQueue } = useRoomStore();
  const playlists = usePlaylistStore((state) => state.playlists);
  const { play, pause, audio } = useAudio();
  const socket = useSocket();

  const isHost = userId === hostId && hostId !== null;
  const canControl = !roomCode || isHost;

  const handlePlayPause = () => {
    const currentState = usePlaybackStore.getState();

    // Calculate the real current time based on how long it's been playing
    let realCurrentTime = currentState.currentTime;
    if (currentState.playing && currentState.updatedAt) {
      const elapsed = (Date.now() - currentState.updatedAt) / 1000;
      realCurrentTime += elapsed;
    } else {
      // If it's already paused, use the uiCurrentTime (which has the correct paused position)
      // or fall back to the store's currentTime.
      realCurrentTime = currentState.uiCurrentTime || currentState.currentTime;
    }

    if (playing) {
      if (isHost) {
        socket.emit("pause", { 
          roomCode, 
          currentTime: realCurrentTime 
        });
      } else {
        // Only host can pause in a party, or if offline
        if (!roomCode) {
          usePlaybackStore.setState({ playing: false, updatedAt: Date.now() });
        }
      }
    } else {
      if (isHost) {
        socket.emit("play", {
          roomCode,
          currentTime: realCurrentTime,
          songId: currentState.songId
        });
      } else {
        if (!roomCode) {
          usePlaybackStore.setState({ playing: true, updatedAt: Date.now() });
        }
      }
    }
  };
  
  const handleNext = () => {
    if (roomCode && !isHost) return;
    
    if (roomCode) {
      socket.emit("play-next", { roomCode });
      // Also advance the local playlistQueue (remove the first item)
      if (playlistQueue.length > 0) {
        const newQueue = playlistQueue.slice(1);
        setPlaylistQueue(newQueue);
      }
    } else {
      if (playlistQueue.length > 0) {
        let nextIndex = 0;
        if (shuffle) {
          nextIndex = Math.floor(Math.random() * playlistQueue.length);
        }
        const nextItem = playlistQueue[nextIndex];
        const newQueue = playlistQueue.filter((_, i) => i !== nextIndex);
        setPlaylistQueue(newQueue);
        
        usePlaybackStore.setState({
          songId: nextItem.songId,
          playing: true,
          currentTime: 0,
          updatedAt: Date.now()
        });
      }
    }
  };
  
  const handlePrevious = () => {
    if (roomCode && !isHost) return;
    if (audio) {
      audio.currentTime = 0;
    }
  };

  const handleToggleShuffle = () => {
    if (!canControl) return;

    if (!roomCode || !activePlaylistId) {
      toggleShuffle();
      return;
    }

    const newShuffleState = !shuffle;
    toggleShuffle();

    const currentPlaylistQueue = useRoomStore.getState().playlistQueue;
    const nowPlaying = usePlaybackStore.getState().songId;
    
    // Filter out the currently playing song — it should keep playing
    const remaining = currentPlaylistQueue.filter(item => item.songId !== nowPlaying);
    
    if (newShuffleState) {
      // SHUFFLE ON: shuffle the remaining queue
      const shuffled = [...remaining];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setPlaylistQueue(shuffled);
      socket.emit("set-queue", { roomCode, queue: shuffled });
    } else {
      // SHUFFLE OFF: restore original playlist order, only songs still remaining
      const playlist = playlists.find(p => p.id === activePlaylistId);
      if (playlist) {
        // We need to reorder `remaining` according to the original `playlist.songIds`
        const restored = [];
        const remainingSet = new Set(remaining);
        
        for (const songId of playlist.songIds) {
          const item = remaining.find(r => r.songId === songId);
          if (item) {
            restored.push(item);
            remainingSet.delete(item);
          }
        }
        
        // Append any manually added songs that weren't part of the original playlist
        restored.push(...Array.from(remainingSet));
        
        setPlaylistQueue(restored);
        socket.emit("set-queue", { roomCode, queue: restored });
      }
    }
  };

  if (mobileOnly) {
    return (
      <div className={`flex items-center gap-2 ${!canControl ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={handleToggleShuffle}
          disabled={!canControl}
          className={`transition ${shuffle ? "text-[#0A84FF]" : "text-zinc-400"}`}
        >
          <Shuffle size={16} />
        </button>

        <button 
          className="hover:scale-110 transition disabled:opacity-50"
          onClick={handlePrevious}
          disabled={!canControl}
        >
          <SkipBack size={18} />
        </button>

        <button
          onClick={handlePlayPause}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A84FF] shadow-lg shadow-[#0A84FF]/30 transition hover:scale-105"
        >
          {playing ? <Pause fill="white" size={16} /> : <Play fill="white" size={16} className="ml-0.5" />}
        </button>

        <button 
          className="hover:scale-110 transition disabled:opacity-50"
          onClick={handleNext}
          disabled={!canControl}
        >
          <SkipForward size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 ${!canControl ? "opacity-50 pointer-events-none" : ""}`}>
      <button
        onClick={handleToggleShuffle}
        disabled={!canControl}
        className={`transition ${shuffle ? "text-[#0A84FF]" : "text-zinc-400"}`}
      >
        <Shuffle size={18} />
      </button>

      <button 
        className="hover:scale-110 transition disabled:opacity-50"
        onClick={handlePrevious}
        disabled={!canControl}
      >
        <SkipBack size={22} />
      </button>

      <button
        onClick={handlePlayPause}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0A84FF] shadow-lg shadow-[#0A84FF]/30 transition hover:scale-105"
      >
        {playing ? <Pause fill="white" /> : <Play fill="white" />}
      </button>

      <button 
        className="hover:scale-110 transition disabled:opacity-50"
        onClick={handleNext}
        disabled={!canControl}
      >
        <SkipForward size={22} />
      </button>

      <button
        onClick={toggleRepeat}
        disabled={!canControl}
        className={`transition ${repeat ? "text-[#0A84FF]" : "text-zinc-400"}`}
      >
        <Repeat2 size={18} />
      </button>
    </div>
  );
}
