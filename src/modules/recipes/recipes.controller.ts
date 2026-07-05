import type { Request, Response } from "express";
import {
  bulkCreateRecipesSchema,
  createRecipeSchema,
  updateRecipeSchema,
} from "../../schemas/recipe.schema.js";
import {
  bulkCreateRecipes,
  createRecipe,
  deleteRecipe,
  updateRecipe,
} from "./recipes.service.js";
import { param } from "../../utils/params.js";

export async function create(req: Request, res: Response) {
  const input = createRecipeSchema.parse(req.body);
  const recipe = await createRecipe(param(req, "bookId"), input);
  res.status(201).json({ recipe });
}

export async function bulkCreate(req: Request, res: Response) {
  const input = bulkCreateRecipesSchema.parse(req.body);
  const result = await bulkCreateRecipes(param(req, "bookId"), input);
  res.status(201).json(result);
}

export async function update(req: Request, res: Response) {
  const input = updateRecipeSchema.parse(req.body);
  const recipe = await updateRecipe(param(req, "id"), input);
  res.json({ recipe });
}

export async function remove(req: Request, res: Response) {
  await deleteRecipe(param(req, "id"));
  res.status(204).send();
}
