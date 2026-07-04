"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import Modal from "./Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useSongStore } from "@/store/songStore";
import { UploadCloud } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function UploadSongModal({ open, onClose }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fetchSongs = useSongStore((state) => state.fetchSongs);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.toLowerCase().endsWith(".mp3")) {
        toast.error("Only .mp3 files are allowed");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }
    if (!username.trim() || !password.trim()) {
      toast.error("Admin credentials are required");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("username", username);
      formData.append("password", password);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to upload song");
      }

      toast.success("Song uploaded to S3 successfully!");
      
      // Now trigger a refresh to fetch the new S3 songs
      const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/songs/refresh`, {
        method: "POST"
      });
      if (refreshRes.ok) {
        await fetchSongs();
        toast.success("Song list updated!");
      }

      // Reset form
      setFile(null);
      setUsername("");
      setPassword("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Upload New Song">
      <div className="space-y-5">
        <div 
          className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-white/40 transition hover:bg-white/5"
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            accept=".mp3,audio/mpeg" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <UploadCloud className="mx-auto mb-2 text-zinc-400" size={32} />
          {file ? (
            <p className="text-sm text-green-400 font-medium truncate">{file.name}</p>
          ) : (
            <p className="text-sm text-zinc-400">Click to select an MP3 file</p>
          )}
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Admin Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            placeholder="Admin Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button className="w-full" onClick={handleUpload} disabled={isUploading || !file}>
          {isUploading ? "Uploading..." : "Upload to S3"}
        </Button>
      </div>
    </Modal>
  );
}
