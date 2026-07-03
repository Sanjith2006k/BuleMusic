import type { Song } from "./song";

export interface Member {
  id: string;
  name: string;
  isHost: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  members: Member[];
  queue: Song[];
  currentSong?: Song;
  currentTime: number;
  playing: boolean;
}
