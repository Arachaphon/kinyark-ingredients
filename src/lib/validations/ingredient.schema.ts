import { z } from "zod";

// Validates a single ingredient lookup (name-based search / display)
export const ingredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required"),
});

// Validates ingredient ID reference used in RecipeIngredient join table
export const ingredientIdSchema = z.object({
  ingredientId: z.number().int().positive("Ingredient ID must be a positive integer"),
});

export type IngredientInput = z.infer<typeof ingredientSchema>;
export type IngredientIdInput = z.infer<typeof ingredientIdSchema>;