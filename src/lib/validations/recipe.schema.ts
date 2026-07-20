import { z } from "zod"

const ingredientItemSchema = z.object({
  name: z.string().min(1, "Ingredient name cannot be empty"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
})

export const createRecipeSchema = z.object({
  recipeName: z
    .string()
    .min(1, "Recipe name is required"),

  description: z.string().optional(),

  ingredients: z
    .array(ingredientItemSchema)
    .min(1, "Please add at least one ingredient"),

  featuredImageUrl: z.string().optional(),

  instructions: z.string().optional(),
})

export type RecipeInput = z.infer<typeof createRecipeSchema>