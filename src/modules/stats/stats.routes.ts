import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getStats } from "./stats.service.js";

export const statsRouter = Router();

statsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({ stats: await getStats() });
  }),
);
