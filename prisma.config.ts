import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma 7 moved the connection URL out of schema.prisma. The CLI (migrate,
 * studio, db push) reads it from here; the runtime client connects via the
 * pg driver adapter in src/db/prisma.ts.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
