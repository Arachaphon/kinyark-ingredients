import { z } from "zod";

// ----- Request -----
export const ingredientInputSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
});

export const userContextSchema = z.object({
  dietaryRestrictions: z.array(z.string()).optional(),
  recentFavorites: z.array(z.string()).optional(),
  searchHistory: z.array(z.string()).optional(),
});

export const generateMenuRequestSchema = z.object({
  ingredients: z.array(ingredientInputSchema).min(1, "ต้องมีวัตถุดิบอย่างน้อย 1 อย่าง"),
  userContext: userContextSchema.optional(),
});

export type IngredientInput = z.infer<typeof ingredientInputSchema>;
export type UserContext = z.infer<typeof userContextSchema>;
export type GenerateMenuRequest = z.infer<typeof generateMenuRequestSchema>;

// ----- Response -----
export const menuItemSchema = z.object({
  name: z.string(),
  ingredients_needed: z.array(z.string()),
  steps: z.array(z.string()),
  serving_size: z.number().int().default(1),
});

export const generateMenuResponseSchema = z.object({
  menus: z.array(menuItemSchema).min(1),
});

export type MenuItem = z.infer<typeof menuItemSchema>;
export type GenerateMenuResponse = z.infer<typeof generateMenuResponseSchema>;