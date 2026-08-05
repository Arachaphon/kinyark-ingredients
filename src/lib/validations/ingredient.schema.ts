import { z } from "zod";

// Validates a single ingredient lookup (name-based search / display)
export const ingredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required"),
});

// Validates ingredient ID reference used in RecipeIngredient join table
export const ingredientIdSchema = z.object({
  ingredientId: z.number().int().positive("Ingredient ID must be a positive integer"),
});

// Validates ingredient URL path param (id)
export const ingredientParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Ingredient ID must be a positive integer").transform((v) => Number(v)),
});

const ingredientFields = z.object({
  name: z.string().trim().min(1, "Ingredient name cannot be empty").max(255),
  category: z.string().trim().min(1).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
})

// Validates creation of an ingredient (upsert by name) with optional category linkage
export const createIngredientSchema = ingredientFields.refine((data) => !(data.category && data.categoryId), {
  message: "Provide either category name or categoryId, not both",
  path: ["category"],
});

// Validates update of an ingredient (name and/or category)
export const updateIngredientSchema = ingredientFields
  .partial()
  .superRefine((data, ctx) => {
    if (!data.name && !data.category && data.categoryId === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "No fields to update" })
    }
  })

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
export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;