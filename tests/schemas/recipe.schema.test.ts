import { describe, expect, it } from "vitest";
import {
  bulkCreateRecipesSchema,
  createRecipeSchema,
  updateRecipeSchema,
} from "../../src/schemas/recipe.schema.js";

describe("createRecipeSchema", () => {
  it("rejects a score outside 1-10", () => {
    expect(
      createRecipeSchema.safeParse({ name: "Tarta", page: 12, score: 0 })
        .success,
    ).toBe(false);
    expect(
      createRecipeSchema.safeParse({ name: "Tarta", page: 12, score: 11 })
        .success,
    ).toBe(false);
    expect(
      createRecipeSchema.safeParse({ name: "Tarta", page: 12, score: 8 })
        .success,
    ).toBe(true);
  });
});

describe("updateRecipeSchema", () => {
  it("rejects an empty object", () => {
    expect(updateRecipeSchema.safeParse({}).success).toBe(false);
  });
});

describe("bulkCreateRecipesSchema", () => {
  it("rejects an empty array", () => {
    expect(bulkCreateRecipesSchema.safeParse({ recipes: [] }).success).toBe(
      false,
    );
  });

  it("rejects more than 500 items", () => {
    const recipes = Array.from({ length: 501 }, (_, i) => ({
      name: `Recipe ${i}`,
      page: i + 1,
    }));
    expect(bulkCreateRecipesSchema.safeParse({ recipes }).success).toBe(false);
  });

  it("accepts a valid batch within bounds", () => {
    const recipes = [{ name: "Pan", page: 3 }];
    expect(bulkCreateRecipesSchema.safeParse({ recipes }).success).toBe(true);
  });
});
