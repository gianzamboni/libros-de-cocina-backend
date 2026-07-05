import { z } from "zod";

/** Mirrors the Prisma BookType enum. */
export const bookTypeSchema = z.enum(["Dulce", "Salado", "Mixto"]);

export const createBookSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    author: z.string().trim().min(1).max(300),
    type: bookTypeSchema,
    currentPage: z.number().int().min(0).default(0),
    totalPages: z.number().int().positive(),
  })
  .refine((data) => data.currentPage <= data.totalPages, {
    message: "currentPage cannot exceed totalPages",
    path: ["currentPage"],
  });

export const updateBookSchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    author: z.string().trim().min(1).max(300).optional(),
    type: bookTypeSchema.optional(),
    currentPage: z.number().int().min(0).optional(),
    totalPages: z.number().int().positive().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const listBooksQuerySchema = z.object({
  type: bookTypeSchema.optional(),
  search: z.string().trim().min(1).max(300).optional(),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type ListBooksQuery = z.infer<typeof listBooksQuerySchema>;
