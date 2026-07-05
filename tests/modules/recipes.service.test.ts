import { describe, expect, it } from "vitest";
import { prismaMock } from "../setup.js";
import {
  createRecipe,
  deleteRecipe,
  updateRecipe,
} from "../../src/modules/recipes/recipes.service.js";

describe("createRecipe", () => {
  it("throws 404 when the book is missing", async () => {
    prismaMock.book.findUnique.mockResolvedValue(null);
    await expect(
      createRecipe("missing", { name: "Pan", page: 3 }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("null-coalesces optional fields on create", async () => {
    prismaMock.book.findUnique.mockResolvedValue({ id: "b1" } as never);
    prismaMock.recipe.create.mockResolvedValue({ id: "r1" } as never);

    await createRecipe("b1", { name: "Pan", page: 3 });

    expect(prismaMock.recipe.create).toHaveBeenCalledWith({
      data: {
        bookId: "b1",
        name: "Pan",
        page: 3,
        score: null,
        comment: null,
        type: null,
      },
    });
  });
});

describe("updateRecipe / deleteRecipe", () => {
  it("updateRecipe throws 404 when the recipe is missing", async () => {
    prismaMock.recipe.findUnique.mockResolvedValue(null);
    await expect(
      updateRecipe("missing", { name: "x" }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("deleteRecipe throws 404 when the recipe is missing", async () => {
    prismaMock.recipe.findUnique.mockResolvedValue(null);
    await expect(deleteRecipe("missing")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
