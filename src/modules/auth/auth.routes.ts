import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middleware/auth.js";
import { loginRateLimiter } from "../../middleware/rateLimit.js";
import { googleLogin, login, me } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/login", loginRateLimiter, asyncHandler(login));
authRouter.post("/google", loginRateLimiter, asyncHandler(googleLogin));
authRouter.get("/me", requireAuth, asyncHandler(me));
