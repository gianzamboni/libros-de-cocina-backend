import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env, isProduction } from "../config/env.js";

/**
 * Single PrismaClient instance shared across the app. In dev, `tsx watch`
 * reloads modules on change, so we stash the client on globalThis to avoid
 * exhausting the connection pool with a new client per reload.
 *
 * Prisma 7 connects through a driver adapter rather than a URL in the schema;
 * the pg adapter is fed the connection string from the validated env.
 */
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: isProduction ? ["error"] : ["query", "warn", "error"],
  });

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}
