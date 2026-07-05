import fs from "node:fs/promises";
import path from "node:path";
import type { Book, Recipe } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { notFound } from "../../utils/httpError.js";
import { uploadDir } from "../../middleware/upload.js";
import type {
  CreateBookInput,
  ListBooksQuery,
  UpdateBookInput,
} from "../../schemas/book.schema.js";

/** Adds derived progress fields (completed = score !== null). */
function withProgress<T extends { recipes: Recipe[] }>(book: T) {
  const total = book.recipes.length;
  const completed = book.recipes.filter((r) => r.score !== null).length;
  return {
    ...book,
    progress: {
      total,
      completed,
      ratio: total === 0 ? 0 : completed / total,
    },
  };
}

export async function listBooks(query: ListBooksQuery) {
  const books = await prisma.book.findMany({
    where: {
      type: query.type,
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { author: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { recipes: { select: { score: true } } },
  });

  return books.map((book) => {
    const total = book.recipes.length;
    const completed = book.recipes.filter((r) => r.score !== null).length;
    const { recipes: _recipes, ...rest } = book;
    return {
      ...rest,
      progress: { total, completed, ratio: total === 0 ? 0 : completed / total },
    };
  });
}

export async function getBook(id: string) {
  const book = await prisma.book.findUnique({
    where: { id },
    include: { recipes: { orderBy: { page: "asc" } } },
  });
  if (!book) throw notFound("Book not found");
  return withProgress(book);
}

/** Loads a book or throws 404. Internal helper for routes that need existence. */
export async function requireBook(id: string): Promise<Book> {
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) throw notFound("Book not found");
  return book;
}

export async function createBook(input: CreateBookInput) {
  return prisma.book.create({ data: input });
}

export async function updateBook(id: string, input: UpdateBookInput) {
  await requireBook(id);
  return prisma.book.update({ where: { id }, data: input });
}

export async function deleteBook(id: string) {
  const book = await requireBook(id);
  await prisma.book.delete({ where: { id } });
  if (book.coverImage) {
    await removeCoverFile(book.coverImage);
  }
}

/** Sets a new cover filename, deleting the previously stored file if any. */
export async function setBookCover(id: string, filename: string) {
  const book = await requireBook(id);
  const updated = await prisma.book.update({
    where: { id },
    data: { coverImage: filename },
  });
  if (book.coverImage && book.coverImage !== filename) {
    await removeCoverFile(book.coverImage);
  }
  return updated;
}

/** Returns the absolute path of a book's cover, or null if it has none. */
export async function getBookCoverPath(id: string): Promise<string> {
  const book = await requireBook(id);
  if (!book.coverImage) throw notFound("This book has no cover");
  return path.join(uploadDir, book.coverImage);
}

async function removeCoverFile(filename: string) {
  try {
    await fs.unlink(path.join(uploadDir, filename));
  } catch {
    // File may already be gone; deletion is best-effort.
  }
}
