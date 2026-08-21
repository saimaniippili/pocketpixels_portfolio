import type { Express } from "express";
import { getDb } from "../db";
import { imageBlobs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const params = req.params as Record<string, string>;
    const key = params['0'];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    try {
      const db = await getDb();
      if (!db) {
        res.status(500).send("Database not available");
        return;
      }

      const results = await db.select()
        .from(imageBlobs)
        .where(eq(imageBlobs.key, key))
        .limit(1);

      if (results.length === 0) {
        res.status(404).send("Image not found");
        return;
      }

      const imageRecord = results[0];
      
      res.set("Content-Type", imageRecord.mimeType);
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      res.status(200).send(imageRecord.data);
      
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
