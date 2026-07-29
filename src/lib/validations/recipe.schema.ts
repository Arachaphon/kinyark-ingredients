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

export const createRecipeSchema = z.object({
  recipeName: z.string().min(1, "Recipe name is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),

  ingredients: z
    .array(ingredientItemSchema)
    .min(1, "Please add at least one ingredient"),
    
  equipmentItems: z.array(equipmentItemSchema).optional(),

  featuredImageUrl: z.string().optional(),
  
  images: z.array(z.string().url("Invalid image URL")).optional(),
  videos: z.array(z.string().url("Invalid video URL")).optional(),

  bgColor: z.string().optional(),
  aiProvider: z.string().optional(),
  visibility: z.enum(["public", "private"]).default("public").optional(),
})

export const updateRecipeSchema = createRecipeSchema.partial()

export type RecipeInput = z.infer<typeof createRecipeSchema>
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>