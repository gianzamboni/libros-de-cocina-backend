import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "../../src/utils/jwt.js";

describe("jwt", () => {
  it("round-trips the user id through sign/verify", () => {
    const token = signToken("user-123");
    expect(verifyToken(token)).toBe("user-123");
  });

  it("throws on a tampered / non-JWT string", () => {
    expect(() => verifyToken("not-a-real-token")).toThrow();
  });
});
