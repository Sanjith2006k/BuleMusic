export interface Member {
  id: string;
  name: string;
  isHost: boolean;
}

export interface PlaybackState {
  songId: string | null;
  currentTime: number;
  playing: boolean;
  updatedAt: number | null;
}

export interface QueueItem {
  id: string;
  songId: string;
  addedBy: string; // The name of the member who added it
}

export interface Room {
  code: string;
  hostId: string;
  members: Member[];

  queue: QueueItem[];

  playback: PlaybackState;
}
