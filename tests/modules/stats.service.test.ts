import { describe, expect, it } from "vitest";
import { prismaMock } from "../setup.js";
import { getStats } from "../../src/modules/stats/stats.service.js";

describe("getStats", () => {
  it("maps groupBy rows into byType with missing types defaulting to 0", async () => {
    prismaMock.book.count.mockResolvedValue(3);
    // Only Dulce/Salado present; Mixto should default to 0.
    prismaMock.book.groupBy.mockResolvedValue([
      { type: "Dulce", _count: { _all: 2 } },
      { type: "Salado", _count: { _all: 1 } },
    ] as never);
    prismaMock.recipe.count
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(4); // completed

    const stats = await getStats();

    expect(stats.booksByType).toEqual({ Dulce: 2, Salado: 1, Mixto: 0 });
    expect(stats.recipes).toEqual({ total: 10, completed: 4, ratio: 0.4 });
  });

  it("returns ratio 0 when there are no recipes", async () => {
    prismaMock.book.count.mockResolvedValue(0);
    prismaMock.book.groupBy.mockResolvedValue([] as never);
    prismaMock.recipe.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const stats = await getStats();

    expect(stats.recipes.ratio).toBe(0);
  });
});
