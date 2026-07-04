import { Request, Response } from "express";
import { s3Service } from "../services/s3.service";
import fs from "fs";
import path from "path";

const SONGS_PATH = path.join(__dirname, "../data/songs.json");

// Helper to read songs.json fresh every time (not cached at import)
export function readSongsFile(): any[] {
  try {
    const raw = fs.readFileSync(SONGS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading songs.json:", e);
    return [];
  }
}

// Helper to write songs.json
export function writeSongsFile(songs: any[]) {
  fs.writeFileSync(SONGS_PATH, JSON.stringify(songs, null, 2), "utf-8");
}

export const getSongs = async (req: Request, res: Response) => {
  try {
    const songs = readSongsFile();

    const songsWithUrls = [];
    const chunkSize = 50;
    
    for (let i = 0; i < songs.length; i += chunkSize) {
      const chunk = songs.slice(i, i + chunkSize);
      const processedChunk = await Promise.all(
        chunk.map(async (song: any) => {
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
      songsWithUrls.push(...processedChunk);
    }

    res.json(songsWithUrls);
  } catch (error) {
    console.error("Error generating signed URLs:", error);
    res.status(500).json({ error: "Failed to load songs" });
  }
};

/**
 * Scan the S3 bucket for new .mp3 files that aren't in songs.json yet.
 * Add them, persist to disk, and return the full updated song list with signed URLs.
 */
export const refreshSongs = async (req: Request, res: Response) => {
  try {
    const songs = readSongsFile();
    const existingKeys = new Set(songs.map((s: any) => s.s3Key));

    // Scan S3 for all .mp3 keys
    const allKeys = await s3Service.listSongKeys();

    // Find new keys that are not in songs.json
    const newKeys = allKeys.filter((key) => !existingKeys.has(key));

    if (newKeys.length > 0) {
      // Determine next ID
      let maxId = 0;
      for (const s of songs) {
        const num = parseInt(s.id, 10);
        if (!isNaN(num) && num > maxId) maxId = num;
      }

      const newSongs = newKeys.map((key, index) => {
        const filename = key.replace("songs/", "").replace(".mp3", "");
        return {
          id: String(maxId + index + 1),
          title: filename,
          artist: "Unknown Artist",
          duration: "3:00",
          cover: `https://picsum.photos/200?${maxId + index + 1}`,
          s3Key: key,
        };
      });

      songs.push(...newSongs);
      writeSongsFile(songs);
      console.log(`Added ${newSongs.length} new songs from S3`);
    }

    // Return all songs with signed URLs, chunked to prevent event loop blocking
    const songsWithUrls = [];
    const chunkSize = 50;
    
    for (let i = 0; i < songs.length; i += chunkSize) {
      const chunk = songs.slice(i, i + chunkSize);
      const processedChunk = await Promise.all(
        chunk.map(async (song: any) => {
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
      songsWithUrls.push(...processedChunk);
    }

    res.json({ newCount: newKeys.length, songs: songsWithUrls });
  } catch (error) {
    console.error("Error refreshing songs from S3:", error);
    res.status(500).json({ error: "Failed to refresh songs" });
  }
};

export const updateSong = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, artist } = req.body;
    
    const songs = readSongsFile();
    const songIndex = songs.findIndex((s: any) => s.id === id);
    if (songIndex === -1) {
      return res.status(404).json({ error: "Song not found" });
    }

    if (title) songs[songIndex].title = title;
    if (artist) songs[songIndex].artist = artist;

    writeSongsFile(songs);

    res.json(songs[songIndex]);
  } catch (error) {
    console.error("Error updating song:", error);
    res.status(500).json({ error: "Failed to update song" });
  }
};

