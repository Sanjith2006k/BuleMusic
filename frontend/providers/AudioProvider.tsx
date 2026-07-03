"use client";

import { ReactNode, useEffect, useState, useRef, useCallback } from "react";
import { AudioContext } from "@/context/AudioContext";
import { usePlaybackStore } from "@/store/playbackStore";
import { usePlayerStore } from "@/store/playerStore";
import { useRoomStore } from "@/store/roomStore";
import { useSongStore } from "@/store/songStore";
import { Play } from "lucide-react";

interface Props {
  children: ReactNode;
}

export default function AudioProvider({ children }: Props) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

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

  // Helper to calculate the exact millisecond we should be at based on server time
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
      // Protection against browsers firing `ended` prematurely due to buffer drops
      if (newAudio.duration && newAudio.currentTime < newAudio.duration - 1) {
        console.warn("Browser fired ended prematurely! Ignoring to prevent skip bug.");
        return;
      }
      
      setPlaybackPlaying(false);
      usePlayerStore.setState({ isPlaying: false });
      
      const { userId, hostId, roomCode } = useRoomStore.getState();
      const { shuffle } = usePlayerStore.getState();
      
      if (userId === hostId && hostId !== null) {
        const songDuration = newAudio.duration;
        import("@/lib/socket").then(({ socket }) => {
          socket.emit("play-next", { roomCode, shuffle, isAuto: true, songDuration });
        });
      }
    };

    const handleCanPlay = () => {
      const targetTime = getTargetTime();
      if (Math.abs(newAudio.currentTime - targetTime) > 0.5) {
        newAudio.currentTime = targetTime;
      }
      if (usePlaybackStore.getState().playing) {
        newAudio.play().catch(e => {
          console.error("Auto-play error on canplay:", e);
          setAutoplayBlocked(true);
        });
      }
    };

    newAudio.addEventListener("loadedmetadata", handleLoadedMetadata);
    newAudio.addEventListener("timeupdate", handleTimeUpdate);
    newAudio.addEventListener("ended", handleEnded);
    newAudio.addEventListener("canplay", handleCanPlay);

    // Periodic Drift Corrector (Runs every 2 seconds)
    const driftInterval = setInterval(() => {
      if (!newAudio || newAudio.paused || !usePlaybackStore.getState().playing) return;
      
      const targetTime = getTargetTime();
      const drift = Math.abs(newAudio.currentTime - targetTime);
      
      // If drift exceeds 200ms, force sync it (Spotify Jam threshold)
      if (drift > 0.2) {
        console.log(`Correcting audio drift of ${drift.toFixed(3)}s`);
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

  // --- Reacting to server state changes (Play / Pause / Seek) ---
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      const targetTime = getTargetTime();
      if (Math.abs(audio.currentTime - targetTime) > 0.5) {
        audio.currentTime = targetTime;
      }
      audio.play().catch(e => {
        console.error("Autoplay blocked:", e);
        setAutoplayBlocked(true);
      });
    } else {
      audio.pause();
      if (Math.abs(audio.currentTime - serverCurrentTime) > 0.5) {
        audio.currentTime = serverCurrentTime;
      }
    }
  }, [playing, updatedAt, serverCurrentTime, getTargetTime]);

  // --- Exposed Audio Engine Functions for Local Overrides (Volume, etc) ---
  const play = async () => {}; // No-op: strictly controlled by server state now
  const pause = () => {}; // No-op
  const seek = (time: number) => {}; // No-op

  const loadSong = (url: string) => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.load();
    }
  };

  const setVolumeLevel = (vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol / 100;
      setPlaybackVolume(vol);
      usePlayerStore.setState({ volume: vol });
    }
  };

  const handleResolveAutoplay = () => {
    setAutoplayBlocked(false);
    if (audioRef.current && usePlaybackStore.getState().playing) {
      audioRef.current.currentTime = getTargetTime();
      audioRef.current.play();
    }
  };

  return (
    <AudioContext.Provider value={{ audio, play, pause, seek, loadSong, setVolume: setVolumeLevel }}>
      {children}
      {autoplayBlocked && (
        <div 
          onClick={handleResolveAutoplay}
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center cursor-pointer transition-opacity"
        >
          <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center max-w-sm mx-4 text-center">
            <div className="w-16 h-16 bg-[#0A84FF] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#0A84FF]/20 animate-pulse">
              <Play fill="white" size={32} className="ml-1" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Tap to Sync</h2>
            <p className="text-zinc-400">Your browser paused the audio. Tap anywhere to join the party perfectly in sync.</p>
          </div>
        </div>
      )}
    </AudioContext.Provider>
  );
}
