import "express";

declare global {
  namespace Express {
    interface Request {
      /** Set by the auth middleware once a valid JWT is verified. */
      userId?: string;
    }
  }
}

export {};
