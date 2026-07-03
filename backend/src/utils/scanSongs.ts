import fs from "fs";
import path from "path";
import * as musicMetadata from "music-metadata";

interface SongData {
  id: string;
  title: string;
  artist: string;
  duration: string;
  cover: string;
  s3Key: string;
}

// Format duration from seconds to m:ss
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

async function scanDirectory(dirPath: string) {
  console.log(`Scanning local directory: ${dirPath}`);
  
  if (!fs.existsSync(dirPath)) {
    console.error("Directory does not exist.");
    return;
  }

  const files = fs.readdirSync(dirPath);
  const mp3Files = files.filter((file) => file.toLowerCase().endsWith(".mp3"));

  console.log(`Found ${mp3Files.length} MP3 files. Extracting metadata...`);

  const songs: SongData[] = [];
  let successCount = 0;

  for (let i = 0; i < mp3Files.length; i++) {
    const filename = mp3Files[i];
    const filePath = path.join(dirPath, filename);

    try {
      const metadata = await musicMetadata.parseFile(filePath);
      
      const title = metadata.common.title || path.basename(filename, ".mp3");
      const artist = metadata.common.artist || "Unknown Artist";
      const durationSecs = metadata.format.duration || 0;
      const duration = formatDuration(durationSecs);
      
      // S3 Key should match how you upload them to the bucket (e.g., songs/filename.mp3)
      const s3Key = `songs/${filename}`;
      
      // Random cover fallback
      const coverNum = (i % 4) + 1;
      const cover = `https://picsum.photos/200?${coverNum}`;

      songs.push({
        id: (i + 1).toString(),
        title,
        artist,
        duration,
        cover,
        s3Key,
      });
      successCount++;
    } catch (error) {
      console.error(`Failed to parse metadata for ${filename}:`, error);
      // Fallback in case of parse error
      songs.push({
        id: (i + 1).toString(),
        title: path.basename(filename, ".mp3"),
        artist: "Unknown Artist",
        duration: "3:00",
        cover: "https://picsum.photos/200",
        s3Key: `songs/${filename}`,
      });
    }
  }

  const outputPath = path.join(__dirname, "../data/songs.json");
  fs.writeFileSync(outputPath, JSON.stringify(songs, null, 2), "utf-8");
  
  console.log(`\nSuccessfully processed ${successCount}/${mp3Files.length} songs!`);
  console.log(`Database saved to: ${outputPath}`);
}

// Get directory from arguments
const folderArg = process.argv[2];
if (!folderArg) {
  console.error("Please specify the path to your local music folder.");
  console.log("Usage: npx ts-node src/utils/scanSongs.ts \"C:\\path\\to\\your\\music\\folder\"");
  process.exit(1);
}

scanDirectory(path.resolve(folderArg));
