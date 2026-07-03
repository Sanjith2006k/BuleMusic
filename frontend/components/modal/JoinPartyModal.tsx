"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Modal from "./Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useRoomStore } from "@/store/roomStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function JoinPartyModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const router = useRouter();

  const handleJoin = async () => {
    if (!name.trim() || !code.trim()) return toast.error("Please enter a name and code");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase(), name }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to join room");
      }

      const data = await res.json();
      
      useRoomStore.getState().setUserId(data.member.id);
      
      toast.success("Joined party!");
      onClose();
      router.push(`/room/${code.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Join Party">
      <div className="space-y-5">
        <Input
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          placeholder="Party Code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />

        <Button className="w-full" onClick={handleJoin}>
          Join Room
        </Button>
      </div>
    </Modal>
  );
}
