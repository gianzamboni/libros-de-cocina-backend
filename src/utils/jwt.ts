import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

interface AppTokenPayload {
  sub: string; // user id
}

/** Signs the app JWT issued by both login methods. */
export function signToken(userId: string): string {
  return jwt.sign({ sub: userId } satisfies AppTokenPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

/** Verifies and decodes an app JWT, returning the user id. Throws on failure. */
export function verifyToken(token: string): string {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string" || typeof decoded.sub !== "string") {
    throw new Error("Malformed token payload");
  }
  return decoded.sub;
}
