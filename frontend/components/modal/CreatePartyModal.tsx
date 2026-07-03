"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { toast } from "sonner";
import { useRoomStore } from "@/store/roomStore";
interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreatePartyModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim() || !adminUsername.trim() || !adminPassword.trim()) {
      return toast.error("Please fill in all fields");
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostName: name, username: adminUsername, password: adminPassword }),
      });

      if (!res.ok) throw new Error("Failed to create room");

      const data = await res.json();
      
      // Store our generated member ID in local store so we can identify ourselves when socket connects
      useRoomStore.getState().setUserId(data.members[0].id);
      
      toast.success("Party created successfully!");
      onClose();
      router.push(`/room/${data.code}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Party">
      <div className="space-y-5">
        <Input
          placeholder="Admin Username"
          value={adminUsername}
          onChange={(e) => setAdminUsername(e.target.value)}
        />
        <Input
          placeholder="Admin Password"
          type="password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
        />
        <Input
          placeholder="Your Display Name in Party"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Button className="w-full" onClick={handleCreate}>
          Create Room
        </Button>
      </div>
    </Modal>
  );
}
