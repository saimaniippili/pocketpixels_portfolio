import { getDb } from "./db";
import { imageBlobs } from "../drizzle/schema";

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  
  const bufferData = typeof data === "string" 
    ? Buffer.from(data) 
    : Buffer.from(data);

  const db = await getDb();
  if (!db) {
    throw new Error("Database connection not available for storage upload.");
  }

  await db.insert(imageBlobs).values({
    key,
    mimeType: contentType,
    data: bufferData,
  });

  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

// Since we are using our own DB, we don't need a signed URL
export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  return `/manus-storage/${key}`;
}
