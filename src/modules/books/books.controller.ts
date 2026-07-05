import type { Request, Response } from "express";
import {
  createBookSchema,
  listBooksQuerySchema,
  updateBookSchema,
} from "../../schemas/book.schema.js";
import { badRequest } from "../../utils/httpError.js";
import { param } from "../../utils/params.js";
import {
  createBook,
  deleteBook,
  getBook,
  getBookCoverPath,
  listBooks,
  setBookCover,
  updateBook,
} from "./books.service.js";

export async function list(req: Request, res: Response) {
  const query = listBooksQuerySchema.parse(req.query);
  res.json({ books: await listBooks(query) });
}

export async function getById(req: Request, res: Response) {
  res.json({ book: await getBook(param(req, "id")) });
}

export async function create(req: Request, res: Response) {
  const input = createBookSchema.parse(req.body);
  res.status(201).json({ book: await createBook(input) });
}

export async function update(req: Request, res: Response) {
  const input = updateBookSchema.parse(req.body);
  res.json({ book: await updateBook(param(req, "id"), input) });
}

export async function remove(req: Request, res: Response) {
  await deleteBook(param(req, "id"));
  res.status(204).send();
}

export async function uploadCover(req: Request, res: Response) {
  if (!req.file) throw badRequest("No image file provided (field name: cover)");
  const book = await setBookCover(param(req, "id"), req.file.filename);
  res.json({ book });
}

export async function getCover(req: Request, res: Response) {
  const filePath = await getBookCoverPath(param(req, "id"));
  res.sendFile(filePath);
}
