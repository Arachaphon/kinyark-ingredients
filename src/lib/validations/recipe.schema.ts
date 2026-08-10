import { z } from "zod"

export const ingredientItemSchema = z.object({
  name: z.string().min(1, "Ingredient name cannot be empty"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  category: z.string().optional(),
})

export const equipmentItemSchema = z.object({
  name: z.string().min(1, "Equipment name cannot be empty"),
})

export const storeSchema = z.object({
  storeName: z.string().min(1, "Store name cannot be empty"),
  sellingPrice: z.coerce.number().min(0, "Selling price must be >= 0"),
  storeDescription: z.string().optional(),
  storeLocation: z.string().optional(),
  contactInfo: z.string().optional(),
  storeImages: z.array(z.string().url("Invalid store image URL")).optional(),
  storeVideos: z.array(z.string().url("Invalid store video URL")).optional(),
  setIngredients: z.array(ingredientItemSchema).optional(),
  recipeId: z.string().uuid("Invalid recipe ID").optional(),
  visibility: z.enum(["public", "protected", "private", "draft"]).optional(),
})

export const createRecipeSchema = z.object({
  recipeName: z.string().min(1, "Recipe name is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),

  ingredients: z
    .array(ingredientItemSchema)
    .min(1, "Please add at least one ingredient"),
    
  equipmentItems: z.array(equipmentItemSchema).optional(),

  store: storeSchema.optional(),

  featuredImageUrl: z.string().optional(),
  
  images: z.array(z.string().url("Invalid image URL")).optional(),
  videos: z.array(z.string().url("Invalid video URL")).optional(),

  bgColor: z.string().optional(),
  aiProvider: z.string().optional(),
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
})

// Validates the :id path param for GET /api/recipes/[id]
export const recipeIdParamSchema = z.object({
  id: z.string().uuid("Invalid recipe ID"),
})

export type RecipeListQuery = z.infer<typeof recipeListQuerySchema>

export type RecipeInput = z.infer<typeof createRecipeSchema>
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>