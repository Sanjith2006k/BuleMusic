"use client";

import { useEffect } from "react";
import { useSongStore } from "@/store/songStore";

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const fetchSongs = useSongStore((state) => state.fetchSongs);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  return <>{children}</>;
}
