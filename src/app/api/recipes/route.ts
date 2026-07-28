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
    const {
      recipeName,
      description,
      instructions,
      ingredients,
      equipmentItems = [],
      featuredImageUrl,
      images = [],
      videos = [],
      bgColor,
      aiProvider,
      visibility,
    } = result.data;

    const allImageUrls = [featuredImageUrl, ...images].filter((url): url is string => !!url);
    const uniqueImageUrls = Array.from(new Set(allImageUrls));

    const equipmentToCreate = equipmentItems.map((equipment) => ({
      name: equipment.name,
    }));

    const imagesToCreate = uniqueImageUrls.map((url) => ({
      imageUrl: url,
    }));

    const videosToCreate = videos.map((url) => ({
      videoUrl: url,
    }));

    const recipe = await prisma.$transaction(async (tx) => {
      const savedIngredients = await Promise.all(
        ingredients.map((ingredient) =>
          tx.ingredient.upsert({
            where: { name: ingredient.name },
            update: {},
            create: { name: ingredient.name },
          })
        )
      );

      const recipeIngredientsToCreate = savedIngredients.map((savedIngredient, index) => {
        const requestedIngredient = ingredients[index];
        return {
          ingredientId: savedIngredient.id,
          quantity: requestedIngredient.quantity,
          unit: requestedIngredient.unit,
        };
      });

      return tx.recipe.create({
        data: {
          userId: user.id,
          recipeName,
          description,
          instructions,
          bgColor,
          aiProvider,
          visibility,
          recipeIngredients: {
            create: recipeIngredientsToCreate,
          },
          ...(equipmentToCreate.length > 0 && {
            equipmentItems: {
              create: equipmentToCreate,
            },
          }),
          ...(imagesToCreate.length > 0 && {
            images: {
              create: imagesToCreate,
            },
          }),
          ...(videosToCreate.length > 0 && {
            videos: {
              create: videosToCreate,
            },
          }),
        },
      });
    }, {
      maxWait: 15000,
      timeout: 30000,
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
        error: error instanceof Error ? error.message : String(error),
        details: error,
      },
      {
        status: 500,
      }
    )
  }
}