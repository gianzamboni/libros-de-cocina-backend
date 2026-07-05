import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uploadImageToMemory } from "../../middleware/upload.js";
import { scan } from "./scan.controller.js";

export const scanRouter = Router();

// Image is kept in memory and forwarded to Claude — never written to the volume.
scanRouter.post("/index", uploadImageToMemory.single("image"), asyncHandler(scan));
