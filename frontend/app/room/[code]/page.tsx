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

  // Join room and handle reconnections
  useEffect(() => {
    if (!hasHydrated || !roomCode || !userId) return;

    const joinRoom = () => {
      // Try to find the user's name from the existing room state
      const myName = useRoomStore.getState().members.find(m => m.id === userId)?.name;

      socket.emit("join-room", {
        code: roomCode,
        memberId: userId,
        name: myName || "Guest",
      });
    };

    // Initial join
    joinRoom();

    // Re-join automatically if socket reconnects
    socket.on("connect", joinRoom);
    
    // Detect poor connection / disconnect
    const handleDisconnect = (reason: string) => {
      if (reason === "io server disconnect" || reason === "io client disconnect") return;
      
      // Auto-pause locally to prevent playing out of sync when connection drops
      usePlaybackStore.getState().setPlaying(false);

      // Warn the user about poor connection if it was an unintentional drop (e.g. ping timeout, transport error)
      const isMobile = window.innerWidth <= 768; // simple mobile check
      if (isMobile) {
        alert("Low connection detected! Your music might fall out of sync. Please refresh the page to sync with the host.");
      } else {
        alert("Connection lost. Trying to reconnect...");
      }
    };
    
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("disconnect", handleDisconnect);
    };
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

    const handleRoomNotFound = () => {
      alert("This party does not exist or has already ended.");
      window.location.href = "/";
    };

    const handleMemberKicked = ({ memberId: kickedMemberId }: { memberId: string }) => {
      if (kickedMemberId === useRoomStore.getState().userId) {
        alert("You have been kicked from the party.");
        window.location.href = "/";
      }
    };

    socket.on("room-updated", handleRoomUpdate);
    socket.on("sync-initial-state", handleInitialSync);
    socket.on("room-ended", handleRoomEnded);
    socket.on("room-not-found", handleRoomNotFound);
    socket.on("member-kicked", handleMemberKicked);

    return () => {
      socket.off("room-updated", handleRoomUpdate);
      socket.off("sync-initial-state", handleInitialSync);
      socket.off("room-ended", handleRoomEnded);
      socket.off("room-not-found", handleRoomNotFound);
      socket.off("member-kicked", handleMemberKicked);
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
