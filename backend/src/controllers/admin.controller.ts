import { Request, Response } from "express";
import { updateAdminCredentials, getAdminCredentials } from "../services/admin.service";

export const updateAdmin = (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const updated = updateAdminCredentials(username, password);
    res.json({ message: "Admin credentials updated", username: updated.username });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const verifyAdmin = (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const current = getAdminCredentials();
    if (username === current.username && password === current.password) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

import { s3Service } from "../services/s3.service";
// We need to import the internal logic of refreshSongs or just fetch the /api/songs/refresh endpoint,
// but calling the internal function is tricky if req/res are bound. 
// Instead, we will just let the frontend call refreshSongs after this succeeds.

export const uploadSong = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const current = getAdminCredentials();
    
    if (username !== current.username || password !== current.password) {
      return res.status(401).json({ success: false, message: "Invalid admin credentials" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { originalname, buffer, mimetype } = req.file;
    
    // Upload to S3
    const key = await s3Service.uploadSong(buffer, originalname, mimetype);

    res.json({ success: true, message: "Song uploaded to S3", key });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
