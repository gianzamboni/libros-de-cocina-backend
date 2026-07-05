import "dotenv/config";
import { z } from "zod";

/**
 * Validates and normalizes process.env at startup. Importing this module will
 * throw (and crash the process) if a required variable is missing or malformed,
 * which is exactly what we want — fail fast on boot rather than mid-request.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:5173")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(1, "ADMIN_PASSWORD is required"),
  GOOGLE_CLIENT_ID: z.string().optional(),

  UPLOAD_DIR: z.string().default("./uploads"),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(5_242_880),

  ANTHROPIC_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
  );
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
