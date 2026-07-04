import { Server, Socket } from "socket.io";
import roomService from "../services/room.service";
import crypto from "crypto";

export function registerQueueEvents(io: Server, socket: Socket) {
  socket.on("add-to-queue", ({ roomCode, songId, memberId }) => {
    const room = roomService.getRoom(roomCode);
    if (!room) return;

    const member = room.members.find(m => m.id === memberId);
    const addedBy = member ? member.name : "Unknown User";

    if (!room.playback.songId) {
      // Auto-play if nothing is currently playing
      room.playback.songId = songId;
      room.playback.currentTime = 0;
      room.playback.playing = true;
      room.playback.updatedAt = Date.now();
      
      io.to(roomCode).emit("playback-state", room.playback);
      io.to(roomCode).emit("room-updated", room);
    } else {
      room.queue.push({
        id: crypto.randomUUID(),
        songId,
        addedBy
      });
      io.to(roomCode).emit("room-updated", room);
    }
  });

  socket.on("play-next-queue", ({ roomCode, songId, memberId }) => {
    const room = roomService.getRoom(roomCode);
    if (!room) return;

    const member = room.members.find(m => m.id === memberId);
    const addedBy = member ? member.name : "Unknown User";

    if (!room.playback.songId) {
      // Auto-play if nothing is currently playing
      room.playback.songId = songId;
      room.playback.currentTime = 0;
      room.playback.playing = true;
      room.playback.updatedAt = Date.now();
      
      io.to(roomCode).emit("playback-state", room.playback);
      io.to(roomCode).emit("room-updated", room);
    } else {
      room.queue.unshift({
        id: crypto.randomUUID(),
        songId,
        addedBy
      });
      io.to(roomCode).emit("room-updated", room);
    }
  });

  socket.on("remove-from-queue", ({ roomCode, index }) => {
    const room = roomService.getRoom(roomCode);
    if (!room) return;

    room.queue.splice(index, 1);
    io.to(roomCode).emit("room-updated", room);
  });

  socket.on("reorder-queue", ({ roomCode, fromIndex, toIndex }) => {
    const room = roomService.getRoom(roomCode);
    if (!room) return;

    const [movedItem] = room.queue.splice(fromIndex, 1);
    room.queue.splice(toIndex, 0, movedItem);
    
    io.to(roomCode).emit("room-updated", room);
  });
  
  socket.on("play-next", ({ roomCode, isAuto, songDuration }) => {
    const room = roomService.getRoom(roomCode);
    if (!room || room.queue.length === 0) return;

    // Prevent premature automatic skipping
    if (isAuto && room.playback.updatedAt && room.playback.playing) {
      const elapsed = (Date.now() - room.playback.updatedAt) / 1000;
      const totalPlayed = room.playback.currentTime + elapsed;
      
      // If the song supposedly ended automatically but it hasn't even played
      // 90% of its duration (or at least duration - 5s), reject it!
      // This fixes the bug where browsers fire 'ended' falsely.
      if (songDuration && totalPlayed < songDuration - 5) {
        console.log(`[play-next rejected] Premature end detected. Played: ${totalPlayed}s, Duration: ${songDuration}s`);
        return;
      }
    }

    const nextItem = room.queue.shift();
    
    if (nextItem) {
      room.playback.songId = nextItem.songId;
      room.playback.currentTime = 0;
      room.playback.playing = true;
      room.playback.updatedAt = Date.now();
      
      io.to(roomCode).emit("room-updated", room);
      io.to(roomCode).emit("playback-state", room.playback);
    }
  });

  // Replace the entire queue with a new ordered list (used by shuffle/unshuffle)
  socket.on("set-queue", ({ roomCode, queue }) => {
    const room = roomService.getRoom(roomCode);
    if (!room) return;

    room.queue = queue; // expects queue to be QueueItem[]
    io.to(roomCode).emit("room-updated", room);
  });
}
