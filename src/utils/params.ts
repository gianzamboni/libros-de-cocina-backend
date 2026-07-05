import type { Request } from "express";
import { badRequest } from "./httpError.js";

/**
 * Reads a single route parameter as a string. Express 5 types `req.params`
 * values as `string | string[]` (to accommodate wildcard/repeatable segments),
 * so this narrows to a plain string and guards the unexpected cases.
 */
export function param(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string" || value.length === 0) {
    throw badRequest(`Missing or invalid route parameter: ${name}`);
  }
  return value;
}
