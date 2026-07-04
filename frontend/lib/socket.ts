import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Socket.io client for the frontend web app.
 * Configured with aggressive reconnection for Spotify Jam-like reliability.
 */
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  transports: ["websocket", "polling"],
});
