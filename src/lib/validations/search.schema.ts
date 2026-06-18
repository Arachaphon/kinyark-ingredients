import { z } from "zod";

export const searchQuerySchema = z.object({
  query: z.string().min(1, "Search query cannot be empty").max(200, "Search query too long"),
});

export const searchByIngredientsSchema = z.object({
  ingredient_ids: z
    .array(z.number().int().positive("Each ingredient ID must be a positive integer"))
    .min(1, "At least one ingredient ID is required"),
});

// Union — API accepts either a text query OR an array of ingredient IDs
export const searchSchema = z.union([searchQuerySchema, searchByIngredientsSchema]);

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type SearchByIngredientsInput = z.infer<typeof searchByIngredientsSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
