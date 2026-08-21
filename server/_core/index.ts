import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import fs from "fs";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "1gb" }));
  app.use(express.urlencoded({ limit: "1gb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // API Direct Download Endpoint to force downloads on mobile/desktop via Content-Disposition
  app.get("/api/download", async (req, res) => {
    console.log("[DownloadAPI] HIT:", req.originalUrl);
    const { url, filename } = req.query;
    if (typeof url !== "string") {
      console.warn("[DownloadAPI] Error: Missing url parameter");
      return res.status(400).send("Missing URL parameter");
    }

    // Decode URL
    const decodedUrl = decodeURIComponent(url);
    
    // Extract pathname in case it's an absolute URL
    let targetPath = decodedUrl;
    try {
      if (decodedUrl.startsWith("http://") || decodedUrl.startsWith("https://")) {
        const parsedUrl = new URL(decodedUrl);
        targetPath = parsedUrl.pathname;
      }
    } catch (e) {
      // Fallback to decodedUrl
    }

    // Check if the URL is a manus-storage database-backed URL
    if (targetPath.startsWith("/manus-storage/")) {
      const key = targetPath.substring("/manus-storage/".length);
      try {
        const { getDb } = await import("../db");
        const { imageBlobs } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) {
          console.error("[DownloadAPI] DB Error: Database connection unavailable");
          return res.status(500).send("Database not available");
        }

        const results = await db.select()
          .from(imageBlobs)
          .where(eq(imageBlobs.key, key))
          .limit(1);

        if (results.length === 0) {
          console.warn("[DownloadAPI] File not found in DB storage for key:", key);
          return res.status(404).send("File not found in storage");
        }

        const imageRecord = results[0];
        const downloadName = typeof filename === "string" ? filename : path.basename(key);

        // Standard filename escaping for HTTP header compatibility across mobile browsers
        const safeFilename = downloadName.replace(/[^a-zA-Z0-9.-]/g, '_');

        res.setHeader("Content-Type", imageRecord.mimeType);
        res.setHeader("Content-Length", imageRecord.data.length);
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader(
          "Content-Disposition", 
          `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`
        );
        console.log(`[DownloadAPI] Serving DB blob: ${downloadName} (${imageRecord.data.length} bytes)`);
        return res.status(200).send(imageRecord.data);
      } catch (dbErr) {
        console.error("[DownloadAPI] DB retrieval exception:", dbErr);
        return res.status(500).send("Storage retrieval error");
      }
    }

    // Otherwise, handle as a local static file on the filesystem
    const safeUrl = path.normalize(targetPath).replace(/^(\.\.[\/\\])+/, "");

    // Path resolution: static assets are served from client/public in dev or dist/public in production
    const projectRoot = path.resolve(import.meta.dirname, "../..");
    const clientPublicPath = path.resolve(projectRoot, "client", "public");
    const distPublicPath = path.resolve(projectRoot, "dist", "public");

    // Check where the file exists
    let filePath = path.join(clientPublicPath, safeUrl);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(distPublicPath, safeUrl);
    }

    // Double check that it's within the project root to prevent traversal outside
    if (!filePath.startsWith(projectRoot)) {
      console.warn("[DownloadAPI] Access denied for traversal path:", filePath);
      return res.status(403).send("Access denied");
    }

    if (!fs.existsSync(filePath)) {
      console.warn("[DownloadAPI] File not found on disk:", filePath);
      return res.status(404).send("File not found");
    }

    const downloadName = typeof filename === "string" ? filename : path.basename(filePath);

    try {
      const stats = fs.statSync(filePath);
      const safeFilename = downloadName.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // Determine Mime Type
      let mimeType = "application/octet-stream";
      const ext = path.extname(filePath).toLowerCase();
      if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
      else if (ext === ".png") mimeType = "image/png";
      else if (ext === ".webp") mimeType = "image/webp";
      else if (ext === ".gif") mimeType = "image/gif";
      else if (ext === ".svg") mimeType = "image/svg+xml";

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Length", stats.size);
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader(
        "Content-Disposition", 
        `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`
      );

      const stream = fs.createReadStream(filePath);
      stream.on("error", (streamErr) => {
        console.error("[DownloadAPI] File stream exception:", streamErr);
        if (!res.headersSent) {
          res.status(500).send("Error reading file stream");
        }
      });
      console.log(`[DownloadAPI] Serving disk file: ${downloadName} (${stats.size} bytes)`);
      return stream.pipe(res);
    } catch (fsErr) {
      console.error("[DownloadAPI] File stats exception:", fsErr);
      if (!res.headersSent) {
        return res.status(500).send("Error compiling file stats");
      }
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
