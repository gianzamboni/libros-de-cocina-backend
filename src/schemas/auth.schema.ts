import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
