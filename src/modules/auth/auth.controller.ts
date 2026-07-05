import type { Request, Response } from "express";
import { loginSchema, googleLoginSchema } from "../../schemas/auth.schema.js";
import {
  getCurrentUser,
  loginWithGoogle,
  loginWithPassword,
} from "./auth.service.js";

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const session = await loginWithPassword(input);
  res.json(session);
}

export async function googleLogin(req: Request, res: Response) {
  const input = googleLoginSchema.parse(req.body);
  const session = await loginWithGoogle(input);
  res.json(session);
}

export async function me(req: Request, res: Response) {
  const user = await getCurrentUser(req.userId!);
  res.json({ user });
}
