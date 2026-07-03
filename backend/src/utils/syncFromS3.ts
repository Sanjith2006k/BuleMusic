import fs from "fs";
import path from "path";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { env } from "../config/env";

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

async function syncSongsFromS3() {
  console.log(`Syncing songs from S3 Bucket: ${env.S3_BUCKET_NAME}`);
  
  if (!env.S3_BUCKET_NAME) {
    console.error("S3_BUCKET_NAME is not set in your environment.");
    return;
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: env.S3_BUCKET_NAME,
      Prefix: "songs/", // Assuming files are uploaded here
    });

    const response = await s3Client.send(command);
    const contents = response.Contents || [];
    
    // Filter out directories or empty keys
    const mp3Files = contents.filter(item => item.Key && item.Key.toLowerCase().endsWith(".mp3"));

    console.log(`Found ${mp3Files.length} MP3 files in S3. Generating database...`);

    const songs = mp3Files.map((item, index) => {
      // Extract filename from the key (e.g., songs/Artist - Title.mp3 -> Artist - Title)
      const filename = path.basename(item.Key!, ".mp3");
      
      let title = filename;
      let artist = "Unknown Artist";

      // Attempt basic parsing if filename is "Artist - Title"
      if (filename.includes(" - ")) {
        const parts = filename.split(" - ");
        artist = parts[0].trim();
        title = parts.slice(1).join(" - ").trim();
      }

      // Assign a cyclic placeholder cover image
      const coverNum = (index % 4) + 1;
      const cover = `https://picsum.photos/200?${coverNum}`;

      return {
        id: (index + 1).toString(),
        title,
        artist,
        duration: "3:00", // Default since S3 doesn't provide duration
        cover,
        s3Key: item.Key!,
      };
    });

    const outputPath = path.join(__dirname, "../data/songs.json");
    fs.writeFileSync(outputPath, JSON.stringify(songs, null, 2), "utf-8");

    console.log(`Successfully generated songs.json with ${songs.length} tracks!`);
  } catch (error) {
    console.error("Error connecting to S3:", error);
  }
}

syncSongsFromS3();
