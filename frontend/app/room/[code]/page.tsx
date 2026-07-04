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
      console.warn("Socket disconnected:", reason);
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

    return () => {
      socket.off("playback-state", handlePlayback);
    };
  }, [socket, setPlayback]);

  return <PartyLayout />;
}
