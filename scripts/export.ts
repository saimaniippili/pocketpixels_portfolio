import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb, getAllGalleryImages } from "../server/db";
import { imageBlobs } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const EXPORT_DIR = path.resolve(PROJECT_ROOT, "client/public/exported-images");
const STATIC_DATA_PATH = path.resolve(PROJECT_ROOT, "client/src/static-data.json");

async function runExport() {
  console.log("[Export] Starting static site export...");
  
  // Ensure the export directory exists
  await fs.mkdir(EXPORT_DIR, { recursive: true });
  console.log(`[Export] Ensuring export directory exists: ${EXPORT_DIR}`);

  const db = await getDb();
  if (!db) {
    console.error("[Export] Failed to connect to database.");
    process.exit(1);
  }

  // 1. Fetch all published gallery metadata
  const images = await getAllGalleryImages();
  console.log(`[Export] Found ${images.length} published images to export.`);

  const staticImages = [];

  for (const img of images) {
    if (!img.imageKey) continue;

    console.log(`[Export] Processing image: ${img.title}`);

    const isCarousel = img.imageKey.startsWith('["');

    if (isCarousel) {
      try {
        const keys = JSON.parse(img.imageKey) as string[];
        const staticUrls: string[] = [];

        for (let idx = 0; idx < keys.length; idx++) {
          const key = keys[idx];
          const blobs = await db.select().from(imageBlobs).where(eq(imageBlobs.key, key)).limit(1);
          
          if (blobs.length === 0) {
            console.warn(`[Export] WARNING: No BLOB found for key: ${key}`);
            continue;
          }

          const blobRecord = blobs[0];
          
          // Determine file extension
          let ext = ".jpg";
          if (blobRecord.mimeType.includes("png")) ext = ".png";
          if (blobRecord.mimeType.includes("webp")) ext = ".webp";
          if (blobRecord.mimeType.includes("gif")) ext = ".gif";

          // Create a safe filename
          const safeTitle = img.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const filename = `${img.id}_${safeTitle}_${idx}${ext}`;
          const filePath = path.join(EXPORT_DIR, filename);

          // Write binary data to disk
          await fs.writeFile(filePath, blobRecord.data as Buffer);
          staticUrls.push(`/exported-images/${filename}`);
        }

        // Update the object for static-data.json as a JSON string
        staticImages.push({
          ...img,
          imageUrl: JSON.stringify(staticUrls),
        });
      } catch (err) {
        console.error(`[Export] Failed to parse and export carousel for ${img.title}:`, err);
      }
    } else {
      // Fetch single binary BLOB data
      const blobs = await db.select().from(imageBlobs).where(eq(imageBlobs.key, img.imageKey)).limit(1);
      
      if (blobs.length === 0) {
        console.warn(`[Export] WARNING: No BLOB found for key: ${img.imageKey}`);
        continue;
      }

      const blobRecord = blobs[0];
      
      // Determine file extension
      let ext = ".jpg";
      if (blobRecord.mimeType.includes("png")) ext = ".png";
      if (blobRecord.mimeType.includes("webp")) ext = ".webp";
      if (blobRecord.mimeType.includes("gif")) ext = ".gif";

      // Create a safe filename
      const safeTitle = img.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${img.id}_${safeTitle}${ext}`;
      const filePath = path.join(EXPORT_DIR, filename);

      // Write binary data to disk
      await fs.writeFile(filePath, blobRecord.data as Buffer);

      // Update the object for static-data.json
      staticImages.push({
        ...img,
        imageUrl: `/exported-images/${filename}`,
      });
    }
  }

  // 5. Write the static-data.json file
  await fs.writeFile(
    STATIC_DATA_PATH,
    JSON.stringify({ images: staticImages }, null, 2)
  );

  console.log(`[Export] Successfully wrote metadata to ${STATIC_DATA_PATH}`);
  console.log("[Export] Static site export complete! The frontend is ready to be built.");
  
  process.exit(0);
}

runExport().catch((error) => {
  console.error("[Export] Fatal error during export:", error);
  process.exit(1);
});
