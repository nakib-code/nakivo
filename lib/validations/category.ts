import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name cannot exceed 50 characters"),

  description: z
    .string()
    .trim()
    .max(300, "Description cannot exceed 300 characters")
    .optional(),

  image: z
    .string()
    .url("Image must be a valid URL")
    .optional()
    .or(z.literal("")),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryValues = z.infer<
  typeof createCategorySchema
>;

export type UpdateCategoryValues = z.infer<
  typeof updateCategorySchema
>;
