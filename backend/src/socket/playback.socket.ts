import { Server, Socket } from "socket.io";
import roomService from "../services/room.service";

export function registerPlaybackEvents(io: Server, socket: Socket) {
  socket.on("play", ({ roomCode, currentTime, songId }) => {
    const room = roomService.getRoom(roomCode);

    if (!room) return;

    room.playback.songId = songId;
    room.playback.currentTime = currentTime;
    room.playback.playing = true;
    room.playback.updatedAt = Date.now();

    io.to(roomCode).emit("playback-state", room.playback);
  });

  socket.on("pause", ({ roomCode, currentTime }) => {
    const room = roomService.getRoom(roomCode);

    if (!room) return;

    room.playback.currentTime = currentTime;
    room.playback.playing = false;
    room.playback.updatedAt = Date.now(); // Record exactly when it was paused

    io.to(roomCode).emit("playback-state", room.playback);
  });

  socket.on("seek", ({ roomCode, currentTime }) => {
    const room = roomService.getRoom(roomCode);

    if (!room) return;

    room.playback.currentTime = currentTime;
    room.playback.updatedAt = Date.now(); // Always update timestamp on seek

    io.to(roomCode).emit("playback-state", room.playback);
  });
}
