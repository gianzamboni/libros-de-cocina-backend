import { z } from "zod";

export const createRecipeSchema = z.object({
  name: z.string().trim().min(1).max(300),
  page: z.number().int().positive(),
  score: z.number().int().min(1).max(10).nullable().optional(),
  comment: z.string().trim().max(2000).nullable().optional(),
  type: z.string().trim().max(100).nullable().optional(),
});

export const updateRecipeSchema = z
  .object({
    name: z.string().trim().min(1).max(300).optional(),
    page: z.number().int().positive().optional(),
    score: z.number().int().min(1).max(10).nullable().optional(),
    comment: z.string().trim().max(2000).nullable().optional(),
    type: z.string().trim().max(100).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

/** Payload from the scanner confirmation step: a list of {name, page}. */
export const bulkCreateRecipesSchema = z.object({
  recipes: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(300),
        page: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(500),
});

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
export type BulkCreateRecipesInput = z.infer<typeof bulkCreateRecipesSchema>;
