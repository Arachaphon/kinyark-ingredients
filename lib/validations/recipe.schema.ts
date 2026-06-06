import { z } from "zod";

const recipeschema = z.object({
  recipe_name: z.string().min(1, " Must've recipe name"),
  description: z.string().min(1, " Must've description"),
  ingredients: z.array(z.string().min(1, "Must've ingredient")),
  featured_image: z.string().optional(),
  in
});

const result = recipeschema.safeParse(body);
if (!result.success) {
  return result.error.flatten();
}
