import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", () => ({
  default: { unlink: vi.fn().mockResolvedValue(undefined) },
}));

import fs from "node:fs/promises";
import { prismaMock } from "../setup.js";
import {
  deleteBook,
  getBook,
  listBooks,
  requireBook,
  setBookCover,
} from "../../src/modules/books/books.service.js";
import { HttpError } from "../../src/utils/httpError.js";

const unlink = vi.mocked(fs.unlink);

const baseBook = {
  id: "b1",
  title: "T",
  author: "A",
  type: "Dulce",
  currentPage: 0,
  totalPages: 100,
  coverImage: null as string | null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  unlink.mockClear();
});

describe("listBooks", () => {
  it("derives progress and strips the raw recipes field", async () => {
    prismaMock.book.findMany.mockResolvedValue([
      { ...baseBook, recipes: [{ score: 5 }, { score: null }] },
    ] as never);

    const result = await listBooks({});

    expect(result[0]).not.toHaveProperty("recipes");
    expect(result[0]!.progress).toEqual({
      total: 2,
      completed: 1,
      ratio: 0.5,
    });
  });

  it("adds the title/author OR search filter only when search is set", async () => {
    prismaMock.book.findMany.mockResolvedValue([] as never);

    await listBooks({ search: "choc" });
    const withSearch = prismaMock.book.findMany.mock.calls[0]![0];
    expect(withSearch?.where).toHaveProperty("OR");

    prismaMock.book.findMany.mockClear();
    await listBooks({});
    const without = prismaMock.book.findMany.mock.calls[0]![0];
    expect(without?.where).not.toHaveProperty("OR");
  });
});

describe("getBook", () => {
  it("returns the book with progress when found", async () => {
    prismaMock.book.findUnique.mockResolvedValue({
      ...baseBook,
      recipes: [{ score: 7 }],
    } as never);

    const book = await getBook("b1");
    expect(book.progress.completed).toBe(1);
  });

  it("throws 404 when not found", async () => {
    prismaMock.book.findUnique.mockResolvedValue(null);
    await expect(getBook("missing")).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("requireBook", () => {
  it("throws 404 when the book is missing", async () => {
    prismaMock.book.findUnique.mockResolvedValue(null);
    await expect(requireBook("missing")).rejects.toBeInstanceOf(HttpError);
  });
});

describe("deleteBook", () => {
  it("unlinks the cover file when coverImage is set", async () => {
    prismaMock.book.findUnique.mockResolvedValue({
      ...baseBook,
      coverImage: "cover.jpg",
    } as never);
    prismaMock.book.delete.mockResolvedValue(baseBook as never);

    await deleteBook("b1");

    expect(unlink).toHaveBeenCalledOnce();
  });

  it("does not unlink when there is no cover", async () => {
    prismaMock.book.findUnique.mockResolvedValue({
      ...baseBook,
      coverImage: null,
    } as never);
    prismaMock.book.delete.mockResolvedValue(baseBook as never);

    await deleteBook("b1");

    expect(unlink).not.toHaveBeenCalled();
  });
});

describe("setBookCover", () => {
  it("unlinks the previous cover only when it differs from the new one", async () => {
    prismaMock.book.findUnique.mockResolvedValue({
      ...baseBook,
      coverImage: "old.jpg",
    } as never);
    prismaMock.book.update.mockResolvedValue({
      ...baseBook,
      coverImage: "new.jpg",
    } as never);

    await setBookCover("b1", "new.jpg");

    expect(unlink).toHaveBeenCalledOnce();
  });
});
