import { z } from "zod"

export const ingredientItemSchema = z.object({
  name: z.string().trim().min(1, "Ingredient name cannot be empty").max(120, "Ingredient name is too long"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0").max(1_000_000, "Quantity is too large"),
  unit: z.string().trim().min(1, "Unit is required").max(30, "Unit is too long"),
  category: z.string().trim().min(1).max(120).optional(),
})

export const equipmentItemSchema = z.object({
  name: z.string().trim().min(1, "Equipment name cannot be empty").max(120, "Equipment name is too long"),
})

export const storeSchema = z.object({
  storeName: z.string().trim().min(1, "Store name cannot be empty").max(120, "Store name is too long"),
  sellingPrice: z.coerce.number().min(0, "Selling price must be >= 0").max(100_000_000, "Selling price is too large"),
  storeDescription: z.string().max(1000).optional(),
  storeLocation: z.string().max(255).optional(),
  contactInfo: z.string().max(255).optional(),
  storeImages: z.array(z.string().url("Invalid store image URL")).optional(),
  storeVideos: z.array(z.string().url("Invalid store video URL")).optional(),
  setIngredients: z.array(ingredientItemSchema).optional(),
  recipeId: z.string().uuid("Invalid recipe ID").optional(),
  visibility: z.enum(["public", "protected", "private", "draft"]).optional(),
})

export const createRecipeSchema = z.object({
  recipeName: z.string().trim().min(1, "Recipe name is required").max(150, "Recipe name is too long"),
  description: z.string().max(1000).optional(),
  instructions: z.string().max(20_000).optional(),

  ingredients: z
    .array(ingredientItemSchema)
    .min(1, "Please add at least one ingredient"),

  equipmentItems: z.array(equipmentItemSchema).optional(),

  store: storeSchema.optional(),

  featuredImageUrl: z.string().url("Invalid image URL").optional(),

  images: z.array(z.string().url("Invalid image URL")).optional(),
  videos: z.array(z.string().url("Invalid video URL")).optional(),

  bgColor: z.string().trim().max(30, "Invalid background color").optional(),
  aiProvider: z.string().trim().min(1).max(50).optional(),
  visibility: z.enum(["public", "protected", "private", "draft"]).default("public").optional(),
  systemRecipeId: z.string().uuid("Invalid system recipe ID").optional(),
  referenceRecipeId: z.string().uuid("Invalid reference recipe ID").nullish(),
})

export const updateRecipeSchema = createRecipeSchema
  .partial()
  .omit({ visibility: true })
  .extend({
    visibility: z.enum(["public", "protected", "private", "draft"]).optional(),
  })

// Validates query params for GET /api/recipes
// ?mine=true (owner feed, all visibility) vs public feed (visibility = "public")
export const recipeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  mine: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  publicOnly: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  aiProvider: z.string().trim().toLowerCase().optional(),
  authorType: z.enum(["all", "user", "ai"]).default("all").optional(),
})

// Validates the :id path param for GET /api/recipes/[id]
export const recipeIdParamSchema = z.object({
  id: z.string().uuid("Invalid recipe ID"),
})

export type RecipeListQuery = z.infer<typeof recipeListQuerySchema>

export type RecipeInput = z.infer<typeof createRecipeSchema>
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>