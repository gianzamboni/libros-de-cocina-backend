import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { booksRouter } from "./modules/books/books.routes.js";
import { recipesRouter } from "./modules/recipes/recipes.routes.js";
import { scanRouter } from "./modules/scan/scan.routes.js";
import { statsRouter } from "./modules/stats/stats.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  // Unauthenticated liveness probe for Railway.
  app.get("/healthz", (_req, res) => res.json({ status: "ok" }));

  // Public auth routes (login / google). Rate-limited inside the router.
  app.use("/api/auth", authRouter);

  // Everything below requires a valid JWT.
  app.use("/api", requireAuth);
  app.use("/api/books", booksRouter);
  app.use("/api/recipes", recipesRouter);
  app.use("/api/scan", scanRouter);
  app.use("/api/stats", statsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
