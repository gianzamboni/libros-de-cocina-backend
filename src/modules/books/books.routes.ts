import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uploadImage } from "../../middleware/upload.js";
import { bookRecipesRouter } from "../recipes/recipes.routes.js";
import {
  create,
  getById,
  getCover,
  list,
  remove,
  update,
  uploadCover,
} from "./books.controller.js";

export const booksRouter = Router();

booksRouter.get("/", asyncHandler(list));
booksRouter.post("/", asyncHandler(create));
booksRouter.get("/:id", asyncHandler(getById));
booksRouter.patch("/:id", asyncHandler(update));
booksRouter.delete("/:id", asyncHandler(remove));

// Book cover: always bound to a book — no context-free image uploads.
booksRouter.put(
  "/:id/cover",
  uploadImage.single("cover"),
  asyncHandler(uploadCover),
);
booksRouter.get("/:id/cover", asyncHandler(getCover));

// Nested recipe creation under a book.
booksRouter.use("/:bookId/recipes", bookRecipesRouter);
