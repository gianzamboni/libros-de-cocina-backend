import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { ensureUploadDir } from "./middleware/upload.js";
import { prisma } from "./db/prisma.js";

async function main() {
  // Ensure the upload directory exists (on Railway, inside the mounted volume).
  ensureUploadDir();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`🍳 Backend listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down...`);
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
