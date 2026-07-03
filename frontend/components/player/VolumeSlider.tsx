"use client";

import { Volume2 } from "lucide-react";

import { usePlaybackStore } from "@/store/playbackStore";
import useAudio from "@/hooks/useAudio";

export default function VolumeSlider() {
  const { setVolume: setAudioVolume } = useAudio();
  const volume = usePlaybackStore((state) => state.volume);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setAudioVolume(value);
  };

  return (
    <div className="flex items-center gap-3">
      <Volume2 size={18} />

      <input
        type="range"
        min={0}
        max={100}
        value={volume}
        onChange={handleVolumeChange}
        className="w-28 accent-[#0A84FF] cursor-pointer"
      />
    </div>
  );
}
