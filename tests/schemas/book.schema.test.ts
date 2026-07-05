import { describe, expect, it } from "vitest";
import {
  createBookSchema,
  updateBookSchema,
} from "../../src/schemas/book.schema.js";

describe("createBookSchema", () => {
  it("accepts a valid book and defaults currentPage to 0", () => {
    const result = createBookSchema.parse({
      title: "Salt Fat Acid Heat",
      author: "Samin Nosrat",
      type: "Salado",
      totalPages: 480,
    });
    expect(result.currentPage).toBe(0);
  });

  it("rejects when currentPage exceeds totalPages", () => {
    const result = createBookSchema.safeParse({
      title: "X",
      author: "Y",
      type: "Dulce",
      currentPage: 500,
      totalPages: 100,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toContain("currentPage");
  });
});

describe("updateBookSchema", () => {
  it("rejects an empty object (at least one field required)", () => {
    expect(updateBookSchema.safeParse({}).success).toBe(false);
  });
});
