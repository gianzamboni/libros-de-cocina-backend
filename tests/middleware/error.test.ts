import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { errorHandler, notFoundHandler } from "../../src/middleware/error.js";
import { HttpError } from "../../src/utils/httpError.js";
import { loginSchema } from "../../src/schemas/auth.schema.js";

function makeRes() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const next = vi.fn() as unknown as NextFunction;

describe("errorHandler", () => {
  it("maps a ZodError to 400 with details", () => {
    const res = makeRes();
    const zodError = loginSchema.safeParse({}).error!;

    errorHandler(zodError, {} as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Validation failed" }),
    );
  });

  it("maps a Multer LIMIT_FILE_SIZE error to 413", () => {
    const res = makeRes();
    errorHandler(
      new multer.MulterError("LIMIT_FILE_SIZE"),
      {} as Request,
      res,
      next,
    );
    expect(res.status).toHaveBeenCalledWith(413);
  });

  it("maps other Multer errors to 400", () => {
    const res = makeRes();
    errorHandler(
      new multer.MulterError("LIMIT_FILE_COUNT"),
      {} as Request,
      res,
      next,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("maps an HttpError to its own status code", () => {
    const res = makeRes();
    errorHandler(new HttpError(403, "Nope"), {} as Request, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Nope" });
  });

  it("maps an unknown error to 500", () => {
    const res = makeRes();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    errorHandler(new Error("kaboom"), {} as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });
});

describe("notFoundHandler", () => {
  it("responds 404 with the route in the message", () => {
    const res = makeRes();
    notFoundHandler({ method: "GET", path: "/nope" } as Request, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Route not found: GET /nope",
    });
  });
});
