import { z } from "zod";

// Validates a single ingredient lookup (name-based search / display)
export const ingredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required"),
});

// Validates ingredient ID reference used in RecipeIngredient join table
export const ingredientIdSchema = z.object({
  ingredientId: z.number().int().positive("Ingredient ID must be a positive integer"),
});

// Validates query params for GET /api/ingredients
// Supports get-all (no params), get-by-id, get-by-category (id or name), and search
export const ingredientQuerySchema = z
  .object({
    id: z.coerce.number().int().positive().optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    category: z.string().trim().min(1).optional(),
    search: z.string().trim().min(1).optional(),
  })
  .strict();

export type IngredientQuery = z.infer<typeof ingredientQuerySchema>;
export type IngredientInput = z.infer<typeof ingredientSchema>;
export type IngredientIdInput = z.infer<typeof ingredientIdSchema>;