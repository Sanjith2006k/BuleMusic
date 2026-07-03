"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";

export default function useSocket() {
  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  return socket;
}
