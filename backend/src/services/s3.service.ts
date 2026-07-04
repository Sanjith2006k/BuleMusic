import { S3Client, GetObjectCommand, ListObjectsV2Command, ListObjectsV2CommandOutput, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export const s3Service = {
  async getSignedSongUrl(key: string): Promise<string> {
    if (!env.S3_BUCKET_NAME) {
      console.warn("S3_BUCKET_NAME is not set");
      return "";
    }

    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
    });

    // Generate signed URL valid for 1 hour (3600 seconds)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
  },

  /**
   * Uploads a file to S3 under the "songs/" prefix.
   */
  async uploadSong(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    if (!env.S3_BUCKET_NAME) {
      throw new Error("S3_BUCKET_NAME is not set");
    }

    // Replace spaces with hyphens and ensure it ends with .mp3
    const safeName = fileName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '');
    const key = `songs/${Date.now()}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);
    return key;
  },

  /**
   * List all .mp3 object keys under the "songs/" prefix in the S3 bucket.
   * Uses pagination to handle buckets with more than 1000 objects.
   */
  async listSongKeys(): Promise<string[]> {
    if (!env.S3_BUCKET_NAME) {
      console.warn("S3_BUCKET_NAME is not set");
      return [];
    }

    const keys: string[] = [];
    let continuationToken: string | undefined = undefined;

    do {
      const listCommand: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: env.S3_BUCKET_NAME,
        Prefix: "songs/",
        ContinuationToken: continuationToken,
      });

      const response: ListObjectsV2CommandOutput = await s3Client.send(listCommand);

      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key && obj.Key.endsWith(".mp3")) {
            keys.push(obj.Key);
          }
        }
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    return keys;
  },
};

