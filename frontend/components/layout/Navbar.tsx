"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Music2, UploadCloud } from "lucide-react";
import Link from "next/link";

import Container from "../ui/Container";
import Button from "../ui/Button";
import { APP_NAME } from "@/lib/constants";
import UploadSongModal from "../modal/UploadSongModal";
import { useRoomStore } from "@/store/roomStore";

export default function Navbar() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { userId, hostId } = useRoomStore();
  const isHost = userId === hostId && hostId !== null;

  return (
    <>
      <motion.header
        initial={{ y: -25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50"
      >
        <Container>
          <div className="mt-5 flex h-16 items-center justify-between rounded-full border border-white/10 bg-white/5 px-6 backdrop-blur-2xl">
            <Link href="/" className="flex items-center gap-3 hover:opacity-85 transition-opacity">
              <div className="rounded-full bg-[#0A84FF]/20 p-2">
                <Music2 className="text-[#0A84FF]" size={22} />
              </div>

              <h1 className="text-lg font-semibold tracking-tight">{APP_NAME}</h1>
            </Link>

            <div className="flex items-center gap-4">
              {isHost && (
                <Button variant="secondary" onClick={() => setIsUploadOpen(true)} className="flex items-center gap-2">
                  <UploadCloud size={16} />
                  <span className="hidden sm:inline">Upload</span>
                </Button>
              )}
              <Link href="/about">
                <Button variant="secondary">About</Button>
              </Link>
            </div>
          </div>
        </Container>
      </motion.header>

      <UploadSongModal open={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </>
  );
}
