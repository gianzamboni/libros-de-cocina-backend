import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { bulkCreate, create, remove, update } from "./recipes.controller.js";

/**
 * Recipe-creation routes nested under a book. Mounted at
 * /api/books/:bookId/recipes — `mergeParams` exposes :bookId here.
 */
export const bookRecipesRouter = Router({ mergeParams: true });

bookRecipesRouter.post("/", asyncHandler(create));
bookRecipesRouter.post("/bulk", asyncHandler(bulkCreate));

/** Top-level recipe edit/delete routes. Mounted at /api/recipes. */
export const recipesRouter = Router();

recipesRouter.patch("/:id", asyncHandler(update));
recipesRouter.delete("/:id", asyncHandler(remove));
