"use client";

import { useState } from "react";
import { toast } from "sonner";
import Modal from "./Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useRoomStore } from "@/store/roomStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { hostId } = useRoomStore();
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = async () => {
    if (!hostId) return;
    setIsSaving(true);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username || undefined, password: password || undefined }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update admin credentials");
      }

      toast.success("Admin credentials updated!");
      setPassword("");
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Change Admin Credentials">
      <div className="space-y-5">
        <Input
          placeholder="New Admin Username (leave blank to keep)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          placeholder="New Admin Password (leave blank to keep)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button className="w-full" onClick={handleChange} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Credentials"}
        </Button>
      </div>
    </Modal>
  );
}
