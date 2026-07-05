import { prisma } from "../../db/prisma.js";

/** Aggregates the numbers shown in the Home stats strip. */
export async function getStats() {
  const [totalBooks, booksByType, totalRecipes, completedRecipes] =
    await Promise.all([
      prisma.book.count(),
      prisma.book.groupBy({ by: ["type"], _count: { _all: true } }),
      prisma.recipe.count(),
      prisma.recipe.count({ where: { score: { not: null } } }),
    ]);

  const byType = booksByType.reduce<Record<string, number>>((acc, row) => {
    acc[row.type] = row._count._all;
    return acc;
  }, {});

  return {
    totalBooks,
    booksByType: {
      Dulce: byType.Dulce ?? 0,
      Salado: byType.Salado ?? 0,
      Mixto: byType.Mixto ?? 0,
    },
    recipes: {
      total: totalRecipes,
      completed: completedRecipes,
      ratio: totalRecipes === 0 ? 0 : completedRecipes / totalRecipes,
    },
  };
}
