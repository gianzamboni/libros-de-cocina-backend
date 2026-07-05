import { beforeEach, describe, expect, it, vi } from "vitest";

const { compare, verifyIdToken } = vi.hoisted(() => ({
  compare: vi.fn(),
  verifyIdToken: vi.fn(),
}));

vi.mock("bcryptjs", () => ({ default: { compare } }));

vi.mock("google-auth-library", () => ({
  OAuth2Client: class {
    verifyIdToken = verifyIdToken;
  },
}));

import { prismaMock } from "../setup.js";
import {
  getCurrentUser,
  loginWithGoogle,
  loginWithPassword,
} from "../../src/modules/auth/auth.service.js";

const owner = {
  id: "u1",
  email: "owner@example.com",
  passwordHash: "$2a$12$hash",
  googleSub: null,
  createdAt: new Date(),
};

beforeEach(() => {
  compare.mockReset();
  verifyIdToken.mockReset();
});

describe("loginWithPassword", () => {
  it("throws 401 when the user does not exist", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    compare.mockResolvedValue(false);

    await expect(
      loginWithPassword({ email: "nope@example.com", password: "x" }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("returns a session without leaking the password hash on success", async () => {
    prismaMock.user.findUnique.mockResolvedValue(owner as never);
    compare.mockResolvedValue(true);

    const session = await loginWithPassword({
      email: owner.email,
      password: "correct",
    });

    expect(typeof session.token).toBe("string");
    expect(session.user).not.toHaveProperty("passwordHash");
    expect(session.user.email).toBe(owner.email);
  });
});

describe("loginWithGoogle", () => {
  it("throws 401 when the verified email is not the owner allowlist", async () => {
    verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: "intruder@example.com",
        email_verified: true,
        sub: "google-sub",
      }),
    });

    await expect(
      loginWithGoogle({ idToken: "token" }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("throws 401 when the Google email is unverified", async () => {
    verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: owner.email,
        email_verified: false,
        sub: "google-sub",
      }),
    });

    await expect(
      loginWithGoogle({ idToken: "token" }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe("getCurrentUser", () => {
  it("throws 401 when the user no longer exists", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(getCurrentUser("u1")).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("returns the public user when found", async () => {
    prismaMock.user.findUnique.mockResolvedValue(owner as never);
    const user = await getCurrentUser("u1");
    expect(user).toEqual({
      id: owner.id,
      email: owner.email,
      createdAt: owner.createdAt,
    });
  });
});
