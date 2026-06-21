"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createRecipeSchema } from "@/lib/validations/recipe.schema";
import { prisma } from "@/lib/prisma";

export async function createRecipe(
  prevState: { message?: string },
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { message: "Please login first" };

  // 1. อ่าน ingredients จาก hidden input (JSON string)
  let ingredientsInput: { name: string; quantity: number; unit: string }[] = [];
  try {
    const raw = formData.get("ingredients");
    if (typeof raw === "string") {
      ingredientsInput = JSON.parse(raw);
    }
  } catch {
    ingredientsInput = [];
  }

  // 2. ประกอบ body ดิบ ส่งเข้า Zod (ห้ามมี syntax ของ Prisma ปนเข้ามา)
  const body = {
    recipe_name: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    instructions: (formData.get("instructions") as string) || undefined,
    ingredients: ingredientsInput,
  };

  const result = createRecipeSchema.safeParse(body);
  if (!result.success) return { message: result.error.issues[0].message };

  // 3. dedupe ชื่อก่อน upsert กันชื่อซ้ำชนกัน
  const uniqueNames = [...new Set(result.data.ingredients.map((i) => i.name))];
  const ingredientMap = new Map(
    (
      await Promise.all(
        uniqueNames.map((name) =>
          prisma.ingredient.upsert({
            where: { name },
            update: {},
            create: { name },
          }),
        ),
      )
    ).map((rec) => [rec.name, rec]),
  );

  // 4. สร้าง recipe — quantity/unit ต้องมาจาก result.data.ingredients เสมอ
  await prisma.recipe.create({
    data: {
      userId: user.id,
      recipeName: result.data.recipe_name,
      description: result.data.description,
      instructions: result.data.instructions,
      recipeIngredients: {
        create: result.data.ingredients.map((ing) => ({
          ingredientId: ingredientMap.get(ing.name)!.id,
          quantity: ing.quantity,
          unit: ing.unit,
        })),
      },
    },
  });

  revalidatePath("/my-recipe", "page");
  revalidatePath("/posts", "page");
  redirect("/home");
}