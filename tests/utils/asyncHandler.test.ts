import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../src/utils/asyncHandler.js";

const req = {} as Request;
const res = {} as Response;

describe("asyncHandler", () => {
  it("runs a resolving handler without forwarding an error to next", async () => {
    const next = vi.fn() as unknown as NextFunction;
    const handler = vi.fn().mockResolvedValue(undefined);

    await asyncHandler(handler)(req, res, next);

    expect(handler).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards a rejected promise to next", async () => {
    const next = vi.fn() as unknown as NextFunction;
    const error = new Error("boom");
    const handler = vi.fn().mockRejectedValue(error);

    await asyncHandler(handler)(req, res, next);
    // Let the rejection microtask settle.
    await Promise.resolve();

    expect(next).toHaveBeenCalledWith(error);
  });
});
