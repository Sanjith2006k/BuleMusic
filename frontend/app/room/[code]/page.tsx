"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import PartyLayout from "@/components/party/PartyLayout";
import useSocket from "@/hooks/useSocket";
import useAudio from "@/hooks/useAudio";
import { usePlaybackStore } from "@/store/playbackStore";
import { useRoomStore } from "@/store/roomStore";

export default function RoomPage() {
  const socket = useSocket();
  const params = useParams();
  const { play, pause, seek } = useAudio();

  const setPlayback = usePlaybackStore((state) => state.setPlayback);
  
  const { setRoomState, setUserId, userId, hostId } = useRoomStore();

  const roomCode = Array.isArray(params.code) ? params.code[0] : params.code;

  const [hasHydrated, setHasHydrated] = useState(false);
  
  useEffect(() => {
    const unsubHydrate = useRoomStore.persist.onFinishHydration(() => setHasHydrated(true));
    setHasHydrated(useRoomStore.persist.hasHydrated());
    return () => {
      unsubHydrate();
    };
  }, []);

  // Initialize user ID only after hydration is complete
  useEffect(() => {
    if (hasHydrated && !userId) {
      setUserId(`user-${Math.random().toString(36).substr(2, 9)}`);
    }
  }, [userId, setUserId, hasHydrated]);

  // Join room
  useEffect(() => {
    if (!hasHydrated || !roomCode || !userId) return;

    socket.emit("join-room", {
      code: roomCode,
      memberId: userId,
    });
  }, [socket, roomCode, userId, hasHydrated]);

  // Listen for room updates
  useEffect(() => {
    const handleRoomUpdate = (room: any) => {
      console.log("Room Updated:", room);
      const queue = room.queue || [];
      setRoomState({
        roomCode: room.code,
        hostId: room.hostId,
        members: room.members,
        queue: queue,
      });
      useRoomStore.getState().setPlaylistQueue(queue);
    };

    const handleInitialSync = (room: any) => {
      console.log("Initial Sync:", room);
      const queue = room.queue || [];
      // Sync room state
      setRoomState({
        roomCode: room.code,
        hostId: room.hostId,
        members: room.members,
        queue: queue,
      });
      useRoomStore.getState().setPlaylistQueue(queue);
      // Sync playback state
      setPlayback(room.playback);
      
      // We no longer manually call seek() and play() here. 
      // The AudioProvider will automatically react to the setPlayback call,
      // load the correct song src, and trigger seek/play inside its handleCanPlay listener
      // when the audio is actually ready, preventing race conditions.
    };

    const handleRoomEnded = () => {
      alert("The host has ended the party.");
      window.location.href = "/";
    };

    socket.on("room-updated", handleRoomUpdate);
    socket.on("sync-initial-state", handleInitialSync);
    socket.on("room-ended", handleRoomEnded);

    return () => {
      socket.off("room-updated", handleRoomUpdate);
      socket.off("sync-initial-state", handleInitialSync);
      socket.off("room-ended", handleRoomEnded);
    };
  }, [socket, setRoomState, setPlayback, play, pause, seek]);

  // Listen for playback updates
  useEffect(() => {
    const handlePlayback = (playback: any) => {
      console.log("Playback:", playback);
      setPlayback(playback);
    };

    socket.on("playback-state", handlePlayback);

    const handleUserJoined = () => {
      // Synthesize a pleasant "ting" sound using the Web Audio API
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Settings for a "ting" chime
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        oscillator.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); // Slide up to A6
        
        // Enveloping to make it percussive
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05); // Attack
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1); // Decay
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 1);
      } catch (e) {
        console.error("Failed to play ting sound:", e);
      }
    };

    socket.on("user-joined", handleUserJoined);

    return () => {
      socket.off("playback-state", handlePlayback);
      socket.off("user-joined", handleUserJoined);
    };
  }, [socket, setPlayback]);

  return <PartyLayout />;
}
