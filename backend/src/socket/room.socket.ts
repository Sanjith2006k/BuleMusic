import { Server, Socket } from "socket.io";
import roomService from "../services/room.service";

const disconnectTimeouts = new Map<string, NodeJS.Timeout>();

export function registerRoomEvents(io: Server, socket: Socket) {
  socket.on("join-room", ({ code, memberId, name }) => {
    socket.join(code);
    
    // Store data on socket for disconnect handling
    socket.data = { code, memberId };
    
    // If there was a pending disconnect for this member, cancel it because they rejoined!
    const timeoutKey = `${code}-${memberId}`;
    let isNewJoin = true;
    if (disconnectTimeouts.has(timeoutKey)) {
      clearTimeout(disconnectTimeouts.get(timeoutKey));
      disconnectTimeouts.delete(timeoutKey);
      isNewJoin = false;
    }

    const room = roomService.getRoom(code);

    if (!room) {
      socket.emit("room-not-found");
      return;
    }

    // If they are not in the room members list (e.g. timeout expired or direct link), add them!
    const existingMember = room.members.find(m => m.id === memberId);
    if (!existingMember) {
      room.members.push({
        id: memberId,
        name: name || "Guest",
        isHost: false
      });
      isNewJoin = true; // Treat as new join since they were fully removed
    }

    // Broadcast to everyone that the room member list updated
    io.to(code).emit("room-updated", room);
    
    // Send the complete state specifically to the user who just joined/reconnected.
    // Compute the real current playback position so the joiner doesn't miss audio.
    const now = Date.now();
    let syncPlayback = { ...room.playback };
    if (syncPlayback.playing && syncPlayback.updatedAt) {
      const elapsed = (now - syncPlayback.updatedAt) / 1000;
      syncPlayback = {
        ...syncPlayback,
        currentTime: syncPlayback.currentTime + elapsed,
        updatedAt: now,
      };
    }
    socket.emit("sync-initial-state", { ...room, playback: syncPlayback });

    console.log(`${memberId} joined ${code}`);
  });

  socket.on("leave-room", ({ code, memberId }) => {
    socket.leave(code);
    socket.data = {}; // Clear data
    
    const timeoutKey = `${code}-${memberId}`;
    if (disconnectTimeouts.has(timeoutKey)) {
      clearTimeout(disconnectTimeouts.get(timeoutKey));
      disconnectTimeouts.delete(timeoutKey);
    }

    roomService.leaveRoom(code, memberId);

    const room = roomService.getRoom(code);

    if (room) {
      io.to(code).emit("room-updated", room);
    }

    console.log(`${memberId} explicitly left ${code}`);
  });

  socket.on("end-room", ({ code, hostId }) => {
    const room = roomService.getRoom(code);
    if (!room || room.hostId !== hostId) return; // Only host can end room

    io.to(code).emit("room-ended"); // Broadcast to all clients
    io.in(code).socketsLeave(code); // Force all sockets to leave the room

    roomService.deleteRoom(code);
  });

  socket.on("kick-member", ({ roomCode, memberId }) => {
    const room = roomService.getRoom(roomCode);
    if (!room) return;

    // Verify that the person requesting the kick is the host
    if (socket.data.memberId !== room.hostId) return;

    // Remove the member from the room's member list
    roomService.leaveRoom(roomCode, memberId);

    // Notify everyone (especially the kicked user) that they were kicked
    io.to(roomCode).emit("member-kicked", { memberId });
    io.to(roomCode).emit("room-updated", roomService.getRoom(roomCode));
  });

  socket.on("disconnect", () => {
    const { code, memberId } = socket.data;
    if (code && memberId) {
      const timeoutKey = `${code}-${memberId}`;
      
      // Wait 60 seconds before actually removing the user.
      // This generous timeout accommodates Android Doze mode reconnection delays
      // where the socket may take up to 30s to reconnect after screen-off.
      const timeout = setTimeout(() => {
        roomService.leaveRoom(code, memberId);
        const room = roomService.getRoom(code);
        if (room) {
          io.to(code).emit("room-updated", room);
        }
        console.log(`${memberId} timed out and was removed from ${code}`);
        disconnectTimeouts.delete(timeoutKey);
      }, 60000);
      
      disconnectTimeouts.set(timeoutKey, timeout);
    }
  });

  socket.on("song-renamed", () => {
    // Broadcast globally so all clients know to refresh their songs
    io.emit("songs-refreshed");
  });
}
