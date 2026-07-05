import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { param } from "../../src/utils/params.js";
import { HttpError } from "../../src/utils/httpError.js";

const makeReq = (params: Record<string, unknown>) =>
  ({ params } as unknown as Request);

describe("param", () => {
  it("returns the value when the param exists", () => {
    expect(param(makeReq({ id: "abc" }), "id")).toBe("abc");
  });

  it("throws badRequest when the param is missing", () => {
    expect(() => param(makeReq({}), "id")).toThrowError(HttpError);
    try {
      param(makeReq({}), "id");
    } catch (err) {
      expect((err as HttpError).statusCode).toBe(400);
    }
  });

  it("throws badRequest when the param is an empty string", () => {
    expect(() => param(makeReq({ id: "" }), "id")).toThrowError(HttpError);
  });

  it("throws badRequest when the param is an array (Express 5 wildcard)", () => {
    expect(() => param(makeReq({ id: ["a", "b"] }), "id")).toThrowError(
      HttpError,
    );
  });
});
