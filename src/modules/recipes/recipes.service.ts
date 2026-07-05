import { prisma } from "../../db/prisma.js";
import { notFound } from "../../utils/httpError.js";
import { requireBook } from "../books/books.service.js";
import type {
  BulkCreateRecipesInput,
  CreateRecipeInput,
  UpdateRecipeInput,
} from "../../schemas/recipe.schema.js";

export async function createRecipe(bookId: string, input: CreateRecipeInput) {
  await requireBook(bookId);
  return prisma.recipe.create({
    data: {
      bookId,
      name: input.name,
      page: input.page,
      score: input.score ?? null,
      comment: input.comment ?? null,
      type: input.type ?? null,
    },
  });
}

/** Confirms scanner output: inserts many {name, page} rows in one transaction. */
export async function bulkCreateRecipes(
  bookId: string,
  input: BulkCreateRecipesInput,
) {
  await requireBook(bookId);
  const result = await prisma.recipe.createMany({
    data: input.recipes.map((r) => ({ bookId, name: r.name, page: r.page })),
  });
  return { created: result.count };
}

export async function updateRecipe(id: string, input: UpdateRecipeInput) {
  const existing = await prisma.recipe.findUnique({ where: { id } });
  if (!existing) throw notFound("Recipe not found");
  return prisma.recipe.update({ where: { id }, data: input });
}

export async function deleteRecipe(id: string) {
  const existing = await prisma.recipe.findUnique({ where: { id } });
  if (!existing) throw notFound("Recipe not found");
  await prisma.recipe.delete({ where: { id } });
}
