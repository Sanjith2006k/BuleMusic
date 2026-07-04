"use client";

import { usePlaybackStore } from "@/store/playbackStore";
import { useRoomStore } from "@/store/roomStore";
import useAudio from "@/hooks/useAudio";
import useSocket from "@/hooks/useSocket";
import { formatDuration } from "@/utils/formatDuration";

export default function ProgressBar() {
  const { uiCurrentTime, duration } = usePlaybackStore();
  const { userId, hostId, roomCode } = useRoomStore();
  const { seek } = useAudio();
  const socket = useSocket();

  const isHost = userId === hostId && hostId !== null;

  const progress = duration > 0 ? (uiCurrentTime / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    if (roomCode) {
      socket.emit("seek", {
        roomCode,
        currentTime: newTime,
      });
    } else {
      // Offline mode
      usePlaybackStore.setState({ currentTime: newTime, updatedAt: Date.now() });
    }
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex justify-between text-xs text-zinc-500">
        <span>{formatDuration(Math.floor(uiCurrentTime))}</span>
        <span>{formatDuration(Math.floor(duration))}</span>
      </div>

      <div 
        className="h-1.5 w-full rounded-full bg-white/10 cursor-pointer"
        onClick={handleSeek}
      >
        <div
          className="h-full rounded-full bg-[#0A84FF] transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
