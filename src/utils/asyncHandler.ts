import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Wraps an async route handler so rejected promises are forwarded to Express's
 * error middleware instead of becoming unhandled rejections.
 */
export const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
