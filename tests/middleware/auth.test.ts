import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { requireAuth } from "../../src/middleware/auth.js";
import { signToken } from "../../src/utils/jwt.js";
import { HttpError } from "../../src/utils/httpError.js";

const res = {} as Response;

const makeReq = (authorization?: string) =>
  ({ headers: authorization ? { authorization } : {} } as Request);

describe("requireAuth", () => {
  it("rejects a missing Authorization header", () => {
    const next = vi.fn() as unknown as NextFunction;
    const req = makeReq();

    requireAuth(req, res, next);

    expect(req.userId).toBeUndefined();
    expect((next as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBeInstanceOf(
      HttpError,
    );
  });

  it("rejects a malformed header without the Bearer prefix", () => {
    const next = vi.fn() as unknown as NextFunction;
    requireAuth(makeReq("Token abc"), res, next);
    expect((next as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBeInstanceOf(
      HttpError,
    );
  });

  it("accepts a valid bearer token and sets req.userId", () => {
    const next = vi.fn() as unknown as NextFunction;
    const req = makeReq(`Bearer ${signToken("user-42")}`);

    requireAuth(req, res, next);

    expect(req.userId).toBe("user-42");
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects an invalid / expired token", () => {
    const next = vi.fn() as unknown as NextFunction;
    requireAuth(makeReq("Bearer garbage.token.value"), res, next);
    expect((next as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBeInstanceOf(
      HttpError,
    );
  });
});
