import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { createRecipeSchema } from "@/lib/validations/recipe.schema"

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const body = await request.json()

  const result = createRecipeSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      {
        error: result.error.flatten(),
      },
      {
        status: 400,
      }
    )
  }

  try {
    const recipe = await prisma.$transaction(async (tx) => {
      const ingredientRecords = await Promise.all(
        result.data.ingredients.map((ing) =>
          tx.ingredient.upsert({
            where: { name: ing.name },
            update: {},
            create: { name: ing.name },
          }),
        ),
      );

      const recipeIngredientsData = ingredientRecords.map((dbIng, index) => {
        const inputIng = result.data.ingredients[index];
        return {
          ingredientId: dbIng.id,
          quantity: inputIng.quantity,
          unit: inputIng.unit,
        };
      });

      const equipmentData = result.data.equipmentItems?.map((eq) => ({
        name: eq.name,
      })) || [];

      const imagesData: { imageUrl: string }[] = [];
      if (result.data.featuredImageUrl) {
        imagesData.push({ imageUrl: result.data.featuredImageUrl });
      }
      if (result.data.images) {
        result.data.images.forEach((img) => imagesData.push({ imageUrl: img }));
      }

      const videosData = result.data.videos?.map((vid) => ({
        videoUrl: vid,
      })) || [];

      return await tx.recipe.create({
        data: {
          userId: user.id,
          recipeName: result.data.recipeName,
          description: result.data.description,
          instructions: result.data.instructions,
          bgColor: result.data.bgColor,
          aiProvider: result.data.aiProvider,
          visibility: result.data.visibility,
          recipeIngredients: {
            create: recipeIngredientsData,
          },
          ...(equipmentData.length > 0 && {
            equipmentItems: {
              create: equipmentData,
            },
          }),
          ...(imagesData.length > 0 && {
            images: {
              create: imagesData,
            },
          }),
          ...(videosData.length > 0 && {
            videos: {
              create: videosData,
            },
          }),
        },
      });
    });

    return Response.json(
      {
        data: recipe,
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        error: "Internal server error",
      },
      {
        status: 500,
      }
    )
  }
}