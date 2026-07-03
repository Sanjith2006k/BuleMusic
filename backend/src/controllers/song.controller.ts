import { Request, Response } from "express";
import { s3Service } from "../services/s3.service";
import songs from "../data/songs.json";

export const getSongs = async (req: Request, res: Response) => {
  try {
    const songsWithUrls = await Promise.all(
      songs.map(async (song) => {
        const signedUrl = await s3Service.getSignedSongUrl(song.s3Key);
        
        return {
          id: song.id,
          title: song.title,
          artist: song.artist,
          duration: song.duration,
          cover: song.cover,
          url: signedUrl,
        };
      })
    );

    res.json(songsWithUrls);
  } catch (error) {
    console.error("Error generating signed URLs:", error);
    res.status(500).json({ error: "Failed to load songs" });
  }
};

import fs from "fs";
import path from "path";

export const updateSong = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, artist } = req.body;
    
    const songIndex = songs.findIndex(s => s.id === id);
    if (songIndex === -1) {
      return res.status(404).json({ error: "Song not found" });
    }

    if (title) songs[songIndex].title = title;
    if (artist) songs[songIndex].artist = artist;

    const songsPath = path.join(__dirname, "../data/songs.json");
    fs.writeFileSync(songsPath, JSON.stringify(songs, null, 2), "utf-8");

    res.json(songs[songIndex]);
  } catch (error) {
    console.error("Error updating song:", error);
    res.status(500).json({ error: "Failed to update song" });
  }
};
