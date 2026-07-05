import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import type { User } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { env } from "../../config/env.js";
import { signToken } from "../../utils/jwt.js";
import { unauthorized } from "../../utils/httpError.js";
import type { GoogleLoginInput, LoginInput } from "../../schemas/auth.schema.js";

const googleClient = env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(env.GOOGLE_CLIENT_ID)
  : null;

/** Public shape of the owner returned to the client (never the password hash). */
function toPublicUser(user: User) {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

function buildSession(user: User) {
  return { token: signToken(user.id), user: toPublicUser(user) };
}

/** Email + password login. Used for integration tests / no-browser access. */
export async function loginWithPassword(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Constant-ish work even when the user is missing, to avoid leaking which
  // emails exist via timing.
  const hash = user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinva";
  const ok = await bcrypt.compare(input.password, hash);

  if (!user || !user.passwordHash || !ok) {
    throw unauthorized("Invalid email or password");
  }

  return buildSession(user);
}

/**
 * Google Sign-In login. Verifies the Google ID token, enforces the owner-email
 * allowlist, and links the Google subject to the owner row on first use.
 */
export async function loginWithGoogle(input: GoogleLoginInput) {
  if (!googleClient) {
    throw unauthorized("Google sign-in is not configured on the server");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: input.idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const email = payload?.email?.toLowerCase();

  if (!payload || !email || payload.email_verified !== true) {
    throw unauthorized("Could not verify Google account");
  }

  // Single-user app: only the owner email is allowed in.
  if (email !== env.ADMIN_EMAIL.toLowerCase()) {
    throw unauthorized("This account is not allowed to sign in");
  }

  const owner = await prisma.user.findUnique({ where: { email } });
  if (!owner) {
    // The owner row is created by the seed script; if it's missing the deploy
    // is misconfigured.
    throw unauthorized("Owner account has not been provisioned");
  }

  const user =
    owner.googleSub === payload.sub
      ? owner
      : await prisma.user.update({
          where: { id: owner.id },
          data: { googleSub: payload.sub },
        });

  return buildSession(user);
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw unauthorized("User no longer exists");
  }
  return toPublicUser(user);
}
