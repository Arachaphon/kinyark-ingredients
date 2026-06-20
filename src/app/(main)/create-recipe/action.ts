"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createRecipeSchema } from "@/lib/validations/recipe.schema";
import {prisma} from "@/lib/prisma";

export async function createRecipe(
  prevState: { message?: string },
  formData: FormData,
) {
  const supabase = await createClient();
  const body = {
    recipe_name: formData.get("title") as string,
    description: formData.get("description") as string,
    ingredients: formData.getAll("ingredients") as string[],
    instructions: formData.get("instructions") as string,
  };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { message: "Please login first" };
  const result = createRecipeSchema.safeParse(body);
  if (!result.success) return { message: result.error.issues[0].message };

  const ingredientRecords = await Promise.all(
    result.data.ingredients.map((name) =>
      prisma.ingredient.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  await prisma.recipe.create({
    data: {
      user_id: user.id,
      recipe_name: result.data.recipe_name,
      description: result.data.description,
      instructions: result.data.instructions,
      recipe_ingredients: {
        create: ingredientRecords.map((ing: any) => ({
          ingredient_id: ing.id,
        })),
      },
    },
  });

  revalidatePath("/my-recipe", "page");
  revalidatePath("/posts", "page");
  redirect("/home");
}
