import rateLimit from "express-rate-limit";

/** Throttles the login routes to blunt brute-force attempts. */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later." },
});
