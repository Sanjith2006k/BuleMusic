"use client";

import { motion } from "framer-motion";

const bars = [18, 35, 22, 42, 28, 38, 25];

export default function Waveform() {
  return (
    <div className="mt-8 flex h-12 items-end justify-center gap-1">
      {bars.map((height, index) => (
        <motion.div
          key={index}
          className="w-1 rounded-full bg-[#0A84FF]"
          animate={{
            height: [height, height + 15, height],
          }}
          transition={{
            repeat: Infinity,
            duration: 0.9,
            delay: index * 0.08,
          }}
        />
      ))}
    </div>
  );
}
