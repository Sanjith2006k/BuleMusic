"use client";

import { motion } from "framer-motion";
import { Crown, Headphones } from "lucide-react";

interface Props {
  name: string;
  isHost: boolean;
  online: boolean;
  listening: boolean;
  color: string;
  onKick?: () => void;
}

export default function MemberCard({
  name,
  isHost,
  online,
  listening,
  color,
  onKick,
}: Props) {
  return (
    <motion.div
      layout
      whileHover={{
        scale: 1.02,
      }}
      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 transition"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full font-semibold text-white"
            style={{
              backgroundColor: color,
            }}
          >
            {name.charAt(0)}
          </div>

          <span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#090909] ${
              online ? "bg-green-500" : "bg-zinc-500"
            }`}
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{name}</h3>

            {isHost && (
              <Crown
                size={16}
                className="text-yellow-400"
                fill="currentColor"
              />
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            {listening && (
              <>
                <Headphones size={12} />
                Listening
              </>
            )}

            {!listening && "Idle"}
          </div>
        </div>
      </div>

      {onKick && (
        <button
          onClick={onKick}
          className="ml-4 rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-red-400 transition"
          title="Kick from party"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </motion.div>
  );
}
