"use client";

import Image from "next/image";
import { motion, Reorder } from "framer-motion";
import { Play, X, GripVertical } from "lucide-react";

interface QueueItemProps {
  id: string;
  index: number;
  title: string;
  artist: string;
  duration: string;
  cover: string;
  playing?: boolean;
  isHost?: boolean;
  onRemove?: () => void;
  asReorderItem?: boolean;
}

export default function QueueItem({
  id,
  index,
  title,
  artist,
  duration,
  cover,
  playing = false,
  isHost = false,
  onRemove,
  asReorderItem = false,
}: QueueItemProps) {
  const content = (
    <div className="flex w-full items-center justify-between overflow-hidden">
      <div className="flex items-center gap-3 min-w-0 overflow-hidden flex-1">
        {isHost && asReorderItem && (
          <div className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-white transition shrink-0">
            <GripVertical size={18} />
          </div>
        )}
        <div className="flex w-6 justify-center shrink-0">
          {playing ? (
            <Play size={14} fill="#0A84FF" className="text-[#0A84FF]" />
          ) : (
            <span className="text-zinc-500">{index}</span>
          )}
        </div>

        <Image
          src={cover}
          alt={title}
          width={44}
          height={44}
          className="rounded-xl shrink-0"
        />

        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-sm truncate">{title}</h3>
          <p className="text-xs text-zinc-400 truncate">{artist}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-2">
        <span className="text-xs text-zinc-500">{duration}</span>
        {isHost && (
          <button 
            onClick={onRemove}
            className="text-zinc-600 hover:text-red-500 transition p-1 rounded-full hover:bg-white/5"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );

  const className = `flex items-center rounded-2xl border p-3 transition-all ${
    playing
      ? "border-[#0A84FF]/40 bg-[#0A84FF]/10"
      : "border-white/5 bg-white/5 hover:bg-white/10"
  }`;

  if (asReorderItem) {
    return (
      <Reorder.Item
        value={{ id, title, artist, duration, cover, playing }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileDrag={{ scale: 1.05, zIndex: 50 }}
        className={className + " mb-3 list-none"}
      >
        {content}
      </Reorder.Item>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      className={className}
    >
      {content}
    </motion.div>
  );
}
