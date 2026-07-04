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
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fetchSongs = useSongStore((state) => state.fetchSongs);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles = selectedFiles.filter(file => file.name.toLowerCase().endsWith(".mp3"));
      
      if (validFiles.length !== selectedFiles.length) {
        toast.error("Only .mp3 files are allowed");
      }
      
      setFiles(validFiles);
    }
  };

  const handleUpload = () => {
    if (files.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }
    if (!username.trim() || !password.trim()) {
      toast.error("Admin credentials are required");
      return;
    }

    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file); // Ensure backend is expecting "files" array
    });
    formData.append("username", username);
    formData.append("password", password);

    const xhr = new XMLHttpRequest();
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setProgress(percentComplete);
      }
    };

    xhr.onload = async () => {
      setIsUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        toast.success(`${files.length} song(s) uploaded to S3 successfully!`);
        
        // Trigger a refresh to fetch the new S3 songs
        try {
          const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/songs/refresh`, {
            method: "POST"
          });
          if (refreshRes.ok) {
            await fetchSongs();
            toast.success("Song list updated!");
          }
        } catch (e) {
          console.error("Failed to refresh songs", e);
        }

        // Reset form
        setFiles([]);
        setUsername("");
        setPassword("");
        setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onClose();
      } else {
        let errMsg = "Failed to upload songs";
        try {
          const errorData = JSON.parse(xhr.responseText);
          if (errorData.message) errMsg = errorData.message;
        } catch (e) {}
        toast.error(errMsg);
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      toast.error("An error occurred during the upload");
    };

    xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/upload`);
    xhr.send(formData);
  };

  return (
    <Modal open={open} onClose={onClose} title="Upload New Songs">
      <div className="space-y-5">
        <div 
          className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-white/40 transition hover:bg-white/5 relative overflow-hidden"
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {isUploading && (
            <div 
              className="absolute left-0 bottom-0 h-1 bg-[#0A84FF] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          )}
          
          <input 
            type="file" 
            accept=".mp3,audio/mpeg" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            disabled={isUploading}
          />
          <UploadCloud className={`mx-auto mb-2 ${isUploading ? 'text-[#0A84FF]' : 'text-zinc-400'}`} size={32} />
          
          {files.length > 0 ? (
            <div className="space-y-1">
              <p className="text-sm text-green-400 font-medium">{files.length} file(s) selected</p>
              {isUploading && (
                <p className="text-xs text-[#0A84FF] font-medium">{progress}% Uploaded</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">Click to select MP3 files</p>
          )}
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Admin Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isUploading}
          />
          <Input
            placeholder="Admin Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isUploading}
          />
        </div>

        <Button className="w-full relative overflow-hidden" onClick={handleUpload} disabled={isUploading || files.length === 0}>
          {isUploading ? (
            <span className="relative z-10">Uploading... {progress}%</span>
          ) : (
            "Upload to S3"
          )}
        </Button>
      </div>
    </Modal>
  );
}
