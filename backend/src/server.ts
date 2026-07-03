import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { Server } from "socket.io";
import { registerRoomEvents } from "./socket/room.socket";
import { registerPlaybackEvents } from "./socket/playback.socket";
import { registerQueueEvents } from "./socket/queue.socket";
import app from "./app";

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
  },
});

io.on("connection", (socket) => {
  registerPlaybackEvents(io, socket);
  console.log(`Client Connected: ${socket.id}`);

  registerRoomEvents(io, socket);
  registerQueueEvents(io, socket);

  socket.on("disconnect", () => {
    console.log(`Client Disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Bule Music API running on port ${PORT}`);
});
