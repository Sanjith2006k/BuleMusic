"use client";

import { Copy, LogOut } from "lucide-react";
import Button from "../ui/Button";
import { useRoomStore } from "@/store/roomStore";
import { usePlaybackStore } from "@/store/playbackStore";
import { toast } from "sonner";
import { useState } from "react";
import ChangePasswordModal from "../modal/ChangePasswordModal";
import { KeyRound, Power, Music2 } from "lucide-react";
import useSocket from "@/hooks/useSocket";
import { APP_NAME } from "@/lib/constants";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PartyHeader() {
  const { roomCode, hostId, userId, setRoomState } = useRoomStore();
  const [modalOpen, setModalOpen] = useState(false);
  const isHost = userId === hostId && hostId !== null;
  const socket = useSocket();
  const router = useRouter();

  const handleCopy = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      toast.success("Party code copied to clipboard!");
    }
  };

  const handleEndParty = () => {
    if (confirm("Are you sure you want to end the party for everyone?")) {
      socket.emit("end-room", { code: roomCode, hostId });
    }
  };

  const handleLeaveParty = () => {
    if (confirm("Are you sure you want to leave the party?")) {
      socket.emit("leave-room", { code: roomCode, memberId: userId });
      setRoomState({ roomCode: null, hostId: null });
      usePlaybackStore.getState().setPlaying(false);
      usePlaybackStore.getState().setPlayback({ playing: false, currentTime: 0, updatedAt: Date.now(), duration: 0, songId: null });
      router.push("/");
    }
  };

  return (
    <header className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4 sm:gap-5 py-6 md:py-8">
      <div className="flex items-center gap-4 md:gap-6">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="rounded-full bg-[#0A84FF]/20 p-2">
            <Music2 className="text-[#0A84FF]" size={24} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight hidden sm:block">{APP_NAME}</h1>
        </Link>
        <div className="h-10 w-px bg-white/10 hidden sm:block"></div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Party Room</h1>
          <p className="mt-1 text-xs md:text-sm text-zinc-400">Listen together in perfect sync.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full sm:w-auto">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 md:px-5 md:py-3 backdrop-blur-xl flex-1 sm:flex-none text-center sm:text-left">
          <p className="text-[10px] md:text-xs uppercase tracking-widest text-zinc-500">
            Party Code
          </p>

          <h2 className="mt-1 text-base md:text-lg font-semibold tracking-[0.3em]">
            {roomCode || "------"}
          </h2>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleCopy} title="Copy Room Code">
            <Copy size={18} />
          </Button>

          {isHost ? (
            <>
              <Button variant="secondary" onClick={() => setModalOpen(true)} title="Change Password">
                <KeyRound size={18} />
              </Button>
              <Button variant="danger" onClick={handleEndParty} title="End Party" className="bg-red-500/20 text-red-500 hover:bg-red-500/30">
                <Power size={18} />
              </Button>
            </>
          ) : (
            <Button variant="danger" onClick={handleLeaveParty} title="Leave Party" className="bg-red-500/20 text-red-500 hover:bg-red-500/30">
              <LogOut size={18} />
            </Button>
          )}
        </div>
      </div>

      <ChangePasswordModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </header>
  );
}
