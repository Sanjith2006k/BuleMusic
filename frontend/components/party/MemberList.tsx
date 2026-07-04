"use client";

import { AnimatePresence } from "framer-motion";

import GlassCard from "../ui/GlassCard";
import MemberCard from "./MemberCard";
import { useRoomStore } from "@/store/roomStore";
import useSocket from "@/hooks/useSocket";

export default function MemberList() {
  const { members, hostId, userId, roomCode } = useRoomStore();
  const socket = useSocket();
  const maxMembers = 10; // Or whatever limit we want

  const handleKick = (memberId: string) => {
    if (!roomCode) return;
    if (confirm("Are you sure you want to kick this user from the party?")) {
      socket.emit("kick-member", { roomCode, memberId });
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Members</h2>

        <span className="text-sm text-zinc-500">{members.length}/{maxMembers}</span>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {members.map((member, idx) => {
            // Pick a deterministic color based on index or ID
            const colors = ["#0A84FF", "#30D158", "#FF453A", "#FF9F0A", "#BF5AF2"];
            const color = colors[idx % colors.length];
            return (
              <MemberCard 
                key={member.id} 
                name={member.name || "Unknown"}
                isHost={member.id === hostId} 
                online={true} 
                listening={true}
                color={color}
                onKick={userId === hostId && member.id !== hostId ? () => handleKick(member.id) : undefined}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}
