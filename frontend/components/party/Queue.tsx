"use client";

import { Reorder, AnimatePresence } from "framer-motion";
import GlassCard from "../ui/GlassCard";
import QueueItem from "./QueueItem";
import { useRoomStore } from "@/store/roomStore";
import { useSongStore } from "@/store/songStore";
import useSocket from "@/hooks/useSocket";

export default function Queue() {
  const { queue, hostId, userId, roomCode } = useRoomStore();
  const getSongById = useSongStore((state) => state.getSongById);
  const socket = useSocket();

  const isHost = userId === hostId && hostId !== null;

  // Resolve queue item objects to song objects (retaining the unique queue item ID)
  const resolvedQueue = queue.map((item) => {
    const song = getSongById(item.songId);
    return {
      id: item.id,
      title: song?.title || "Loading...",
      artist: song?.artist || "",
      duration: song?.duration || "",
      cover: song?.cover || "/default-cover.png",
      url: song?.url || "",
    };
  });

  const handleReorder = (newOrder: typeof resolvedQueue) => {
    if (!isHost) return;

    // We can emit reorder events based on changes, but a simple way is just emit 'reorder-queue'
    // To emit the exact from/to indices, we'd need a more complex diff. 
    // For now, let's emit a full queue replacement event or just implement the UI.
    // Actually, framer-motion Reorder calls onReorder with the new array.
    // The backend `reorder-queue` expects `fromIndex`, `toIndex`. 
    // To find them:
    const fromIndex = resolvedQueue.findIndex((item, i) => item.id !== newOrder[i]?.id);
    if (fromIndex !== -1) {
      const movedItem = resolvedQueue[fromIndex];
      const toIndex = newOrder.findIndex((item) => item.id === movedItem.id);
      
      socket.emit("reorder-queue", { roomCode, fromIndex, toIndex });
    }
  };

  const handleRemove = (index: number) => {
    if (!isHost) return;
    socket.emit("remove-from-queue", { roomCode, index });
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Now Playing</h2>
        <span className="text-sm text-zinc-500">{resolvedQueue.length} Songs</span>
      </div>

      <div className="space-y-3">
        {isHost ? (
          <Reorder.Group axis="y" values={resolvedQueue} onReorder={handleReorder}>
            <AnimatePresence mode="popLayout">
              {resolvedQueue.map((song, index) => (
                <QueueItem 
                  key={`${song.id}-${index}`} 
                  index={index + 1} 
                  {...song} 
                  isHost={isHost}
                  onRemove={() => handleRemove(index)}
                  asReorderItem 
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>
        ) : (
          <div className="flex flex-col space-y-3">
            <AnimatePresence mode="popLayout">
              {resolvedQueue.map((song, index) => (
                <QueueItem 
                  key={`${song.id}-${index}`} 
                  index={index + 1} 
                  {...song} 
                  isHost={isHost}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
