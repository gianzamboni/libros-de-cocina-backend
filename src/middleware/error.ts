import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import multer from "multer";
import { HttpError } from "../utils/httpError.js";
import { isProduction } from "../config/env.js";

/** 404 fallthrough for unmatched routes. */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}

/**
 * Central error handler. Translates Zod, Multer, and HttpError instances into
 * clean JSON responses; everything else becomes an opaque 500.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express needs the 4-arg signature
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.flatten().fieldErrors,
    });
  }

  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({ error: err.message });
  }

  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({
    error: isProduction
      ? "Internal server error"
      : err instanceof Error
        ? err.message
        : "Internal server error",
  });
}
