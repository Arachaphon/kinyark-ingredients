import { z } from "zod"

export const createRecipeSchema = z.object({
  recipe_name: z
    .string()
    .min(1, "Recipe name is required"),

  description: z.string().optional(),
  //ถ้าต้องการ required เอา .optional ออก

  ingredients: z
    .array(
      z.string().min(1, "Ingredient name cannot be empty")
    )
    .min(1, "Please add at least one ingredient"),

  featured_image_url: z.string().optional(),
  //ถ้าต้องการ required เอา .optional ออก

  instructions: z.string().optional(),
  //ถ้าต้องการ required เอา .optional ออก
})

export type RecipeInput = z.infer<typeof createRecipeSchema>