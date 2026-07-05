import { beforeEach, vi } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@prisma/client";

// Replace the shared Prisma client with a deep mock. Referencing the `mockDeep`
// import inside the factory is allowed — Vitest hoists imports used here.
vi.mock("../src/db/prisma.js", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

// Pull the same mocked instance back out so individual tests can program return
// values via `prismaMock.book.findUnique.mockResolvedValue(...)`, etc.
import { prisma } from "../src/db/prisma.js";

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});
