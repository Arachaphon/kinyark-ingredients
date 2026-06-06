import { z } from "zod"

export const createRecipeSchema = z.object({
  recipe_name: z
    .string()
    .min(1, "Recipe name is required"),

  description: z.string().optional(),

  ingredients: z
    .array(
      z.string().min(1, "Ingredient name cannot be empty")
    )
    .min(1, "Please add at least one ingredient"),

  featured_image_url: z.string().optional(),

  instructions: z.string().optional(),
})

export type RecipeInput = z.infer<typeof createRecipeSchema>