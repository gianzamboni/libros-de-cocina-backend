import type { NextFunction, Request, Response } from "express";
import { unauthorized } from "../utils/httpError.js";
import { verifyToken } from "../utils/jwt.js";

/**
 * Requires a valid `Authorization: Bearer <jwt>` header. On success, attaches
 * the user id to `req.userId`. Used to guard every /api route except login.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(unauthorized("Missing or malformed Authorization header"));
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    req.userId = verifyToken(token);
    return next();
  } catch {
    return next(unauthorized("Invalid or expired token"));
  }
}
