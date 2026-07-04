"use client";

/**
 * AudioProvider (Frontend/Web Version) — Audio sync engine for BuleMusic web app.
 * 
 * This is the web/desktop browser version. On desktop browsers, background execution 
 * is more permissive than mobile, so we rely on:
 * 1. Web Audio API silent oscillator to keep the JS thread alive
 * 2. MediaSession API to signal active media playback
 * 3. Web Worker keep-alive pings
 * 4. Visibility change resync as a safety net
 */

import { ReactNode, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { AudioContext } from "@/context/AudioContext";
import { usePlaybackStore } from "@/store/playbackStore";
import { usePlayerStore } from "@/store/playerStore";
import { useRoomStore } from "@/store/roomStore";
import { useSongStore } from "@/store/songStore";

interface Props {
  children: ReactNode;
}

export default function AudioProvider({ children }: Props) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync state
  const playing = usePlaybackStore((state) => state.playing);
  const updatedAt = usePlaybackStore((state) => state.updatedAt);
  const currentSongId = usePlaybackStore((state) => state.songId);
  const serverCurrentTime = usePlaybackStore((state) => state.currentTime);
  
  const setPlaybackTime = usePlaybackStore((state) => state.setUiCurrentTime);
  const setPlaybackDuration = usePlaybackStore((state) => state.setDuration);
  const setPlaybackPlaying = usePlaybackStore((state) => state.setPlaying);
  const setPlaybackVolume = usePlaybackStore((state) => state.setVolume);
  const initialVolume = usePlayerStore((state) => state.volume);

  const getSongById = useSongStore((state) => state.getSongById);

  const getTargetTime = useCallback(() => {
    const { playing: isPlaying, currentTime, updatedAt: lastUpdated } = usePlaybackStore.getState();
    if (isPlaying && lastUpdated) {
      const elapsed = (Date.now() - lastUpdated) / 1000;
      return currentTime + elapsed;
    }
    return currentTime;
  }, []);

  // --- Core Sync Engine ---
  useEffect(() => {
    // Silent oscillator keep-alive for desktop browsers
    let audioCtx: AudioContext | null = null;
    let keepAliveStarted = false;

    const startKeepAlive = () => {
      if (keepAliveStarted) return;
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        
        audioCtx = new AudioContextClass();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 0;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        
        if (audioCtx.state === "suspended") {
          audioCtx.resume();
        }
        
        keepAliveStarted = true;
        document.removeEventListener("click", startKeepAlive);
        document.removeEventListener("touchstart", startKeepAlive);
      } catch (e) {
        console.warn("[AudioProvider] Web Audio keep-alive failed:", e);
      }
    };
    
    document.addEventListener("click", startKeepAlive);
    document.addEventListener("touchstart", startKeepAlive);

    const newAudio = new Audio();
    audioRef.current = newAudio;
    setAudio(newAudio);
    newAudio.volume = initialVolume / 100;

    const handleLoadedMetadata = () => {
      setPlaybackDuration(newAudio.duration);
    };

    const handleTimeUpdate = () => {
      setPlaybackTime(newAudio.currentTime);
    };

    const handleEnded = () => {
      if (newAudio.duration && newAudio.currentTime < newAudio.duration - 1) {
        console.warn("[AudioProvider] Premature ended event — ignoring");
        return;
      }
      
      setPlaybackPlaying(false);
      usePlayerStore.setState({ isPlaying: false });
      
      const { userId, hostId, roomCode, playlistQueue, setPlaylistQueue } = useRoomStore.getState();
      const { shuffle } = usePlayerStore.getState();
      
      if (!roomCode) {
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
        return;
      }
      
      if (userId === hostId && hostId !== null) {
        const songDuration = newAudio.duration;
        import("@/lib/socket").then(({ socket }) => {
          socket.emit("play-next", { roomCode, shuffle, isAuto: true, songDuration });
        });
      }
    };

    const handleCanPlay = () => {
      const { roomCode } = useRoomStore.getState();
      if (!roomCode) {
        if (usePlaybackStore.getState().playing) {
          newAudio.play().catch(e => {
            console.warn("[AudioProvider] Autoplay blocked:", e);
          });
        }
        return;
      }

      const targetTime = getTargetTime();
      if (Math.abs(newAudio.currentTime - targetTime) > 1.0) {
        newAudio.currentTime = targetTime;
      }
      if (usePlaybackStore.getState().playing) {
        newAudio.play().catch(e => {
          console.warn("[AudioProvider] Autoplay blocked:", e);
        });
      }
    };

    newAudio.addEventListener("loadedmetadata", handleLoadedMetadata);
    newAudio.addEventListener("timeupdate", handleTimeUpdate);
    newAudio.addEventListener("ended", handleEnded);
    newAudio.addEventListener("canplay", handleCanPlay);

    // Drift corrector
    const driftInterval = setInterval(() => {
      if (!newAudio || newAudio.paused || !usePlaybackStore.getState().playing) return;
      const { roomCode } = useRoomStore.getState();
      if (!roomCode) return;
      
      const targetTime = getTargetTime();
      const drift = Math.abs(newAudio.currentTime - targetTime);
      
      if (drift > 1.5) {
        console.log(`[AudioProvider] Drift correction: ${drift.toFixed(2)}s`);
        newAudio.currentTime = targetTime;
      }
    }, 2000);

    return () => {
      newAudio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      newAudio.removeEventListener("timeupdate", handleTimeUpdate);
      newAudio.removeEventListener("ended", handleEnded);
      newAudio.removeEventListener("canplay", handleCanPlay);
      clearInterval(driftInterval);
      newAudio.pause();
      newAudio.src = "";
      
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close();
      }
      document.removeEventListener("click", startKeepAlive);
      document.removeEventListener("touchstart", startKeepAlive);
    };
  }, [setPlaybackTime, setPlaybackDuration, setPlaybackPlaying, initialVolume, getTargetTime]);

  // --- Source loading ---
  useEffect(() => {
    if (currentSongId && audioRef.current) {
      const song = getSongById(currentSongId);
      if (song && song.url) {
        if (audioRef.current.src !== song.url) {
          audioRef.current.src = song.url;
          audioRef.current.load();
        }
      }
    }
  }, [currentSongId, getSongById]);

  // --- Reacting to server/local state changes ---
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncAudio = (state: ReturnType<typeof usePlaybackStore.getState>) => {
      const { roomCode } = useRoomStore.getState();
      
      if (!roomCode) {
        if (state.playing) {
          audio.play().catch(e => console.warn("[AudioProvider] Autoplay blocked:", e));
        } else {
          audio.pause();
        }
        return;
      }

      if (state.playing) {
        const targetTime = state.currentTime + (state.updatedAt ? (Date.now() - state.updatedAt) / 1000 : 0);
        if (Math.abs(audio.currentTime - targetTime) > 1.0) {
          audio.currentTime = targetTime;
        }
        audio.play().catch(e => console.warn("[AudioProvider] Autoplay blocked:", e));
      } else {
        audio.pause();
        if (Math.abs(audio.currentTime - state.currentTime) > 1.0) {
          audio.currentTime = state.currentTime;
        }
      }
    };

    let prevPlaying = usePlaybackStore.getState().playing;
    let prevUpdatedAt = usePlaybackStore.getState().updatedAt;
    let prevCurrentTime = usePlaybackStore.getState().currentTime;
    let prevSongId = usePlaybackStore.getState().songId;

    const unsubscribe = usePlaybackStore.subscribe((state) => {
      if (
        state.playing !== prevPlaying ||
        state.updatedAt !== prevUpdatedAt ||
        state.currentTime !== prevCurrentTime ||
        state.songId !== prevSongId
      ) {
        prevPlaying = state.playing;
        prevUpdatedAt = state.updatedAt;
        prevCurrentTime = state.currentTime;
        prevSongId = state.songId;
        
        syncAudio(state);
      }
    });

    syncAudio(usePlaybackStore.getState());
    return () => unsubscribe();
  }, []);

  // --- MediaSession API ---
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    
    const updateMediaSession = () => {
      try {
        const state = usePlaybackStore.getState();
        const songId = state.songId;
        if (!songId) return;
        
        const song = useSongStore.getState().getSongById(songId);
        if (!song) return;
        
        navigator.mediaSession.metadata = new MediaMetadata({
          title: song.title || "Unknown Track",
          artist: song.artist || "BuleMusic Party",
          album: "BuleMusic",
          artwork: song.cover ? [{ src: song.cover, sizes: "512x512", type: "image/jpeg" }] : [],
        });
        
        navigator.mediaSession.playbackState = state.playing ? "playing" : "paused";
      } catch (e) {
        // Ignore MediaSession errors
      }
    };
    
    const unsubscribe = usePlaybackStore.subscribe(() => updateMediaSession());
    updateMediaSession();
    return () => unsubscribe();
  }, []);

  // --- Visibility Change Re-Sync ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const audio = audioRef.current;
        if (!audio) return;
        
        const { roomCode, userId, members } = useRoomStore.getState();
        if (!roomCode) return;
        
        const myName = members.find(m => m.id === userId)?.name;
        
        import("@/lib/socket").then(({ socket }) => {
          if (!socket.connected) {
            socket.connect();
          }
          socket.emit("join-room", {
            code: roomCode,
            memberId: userId,
            name: myName || "Guest",
          });
        });
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // --- Web Worker Keep-Alive ---
  useEffect(() => {
    let worker: Worker | null = null;
    
    try {
      worker = new Worker("/keep-alive-worker.js");
      worker.onmessage = () => {
        const audio = audioRef.current;
        if (!audio) return;
        
        const { roomCode } = useRoomStore.getState();
        if (!roomCode) return;
        
        const state = usePlaybackStore.getState();
        if (state.playing && audio.paused) {
          const targetTime = state.currentTime + (state.updatedAt ? (Date.now() - state.updatedAt) / 1000 : 0);
          audio.currentTime = targetTime;
          audio.play().catch(() => {});
        } else if (!state.playing && !audio.paused) {
          audio.pause();
        }
      };
      worker.postMessage("start");
    } catch (e) {
      console.warn("[AudioProvider] Keep-alive worker not available:", e);
    }
    
    return () => {
      if (worker) {
        worker.postMessage("stop");
        worker.terminate();
      }
    };
  }, []);

  // --- Exposed Audio Engine Functions ---
  const play = useCallback(async () => {}, []);
  const pause = useCallback(() => {}, []);
  const seek = useCallback((time: number) => {}, []);

  const loadSong = useCallback((url: string) => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.load();
    }
  }, []);

  const setVolumeLevel = useCallback((vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol / 100;
      setPlaybackVolume(vol);
      usePlayerStore.setState({ volume: vol });
    }
  }, [setPlaybackVolume]);

  const contextValue = useMemo(() => ({
    audio,
    play,
    pause,
    seek,
    loadSong,
    setVolume: setVolumeLevel
  }), [audio, play, pause, seek, loadSong, setVolumeLevel]);

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
}
