"use client";

import { Music2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-[#090909]">
      <div className="text-center">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "linear",
          }}
        >
          <Music2 size={56} className="mx-auto text-[#0A84FF]" />
        </motion.div>

        <p className="mt-6 text-zinc-400">Loading Bule Music...</p>
      </div>
    </div>
  );
}
