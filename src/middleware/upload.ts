import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env.js";
import { badRequest } from "../utils/httpError.js";

/** Absolute path to the upload directory (created on boot if missing). */
export const uploadDir = path.resolve(env.UPLOAD_DIR);

export function ensureUploadDir() {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = EXTENSION_BY_MIME[file.mimetype] ?? "";
    cb(null, `${randomUUID()}${ext}`);
  },
});

/**
 * Multer instance for single-image uploads (covers, scan input). Restricts to
 * image mime types and caps size via MAX_UPLOAD_BYTES.
 */
export const uploadImage = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(badRequest(`Unsupported image type: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

/**
 * Multer instance that keeps the file in memory — used by the scan endpoint,
 * which forwards bytes to Claude and never persists them to the volume.
 */
export const uploadImageToMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(badRequest(`Unsupported image type: ${file.mimetype}`));
    }
    cb(null, true);
  },
});
