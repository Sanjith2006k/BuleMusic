"use client";

import SongCard from "./SongCard";
import type { Song } from "@/types/song";

interface Props {
  songs: Song[];
}

export default function SongList({ songs }: Props) {
  if (songs.length === 0) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-2xl font-semibold">No songs found</h2>

        <p className="mt-3 text-zinc-500">Try another search keyword.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {songs.map((song) => (
        <SongCard key={song.id} song={song} />
      ))}
    </div>
  );
}
