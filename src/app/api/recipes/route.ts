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
    const ingredientRecords = await Promise.all(
      result.data.ingredients.map((ing) =>
        prisma.ingredient.upsert({
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

    const recipe = await prisma.recipe.create({
      data: {
        userId: user.id,
        recipeName: result.data.recipeName,
        description: result.data.description,
        instructions: result.data.instructions,
        recipeIngredients: {
          create: recipeIngredientsData,
        },
        ...(result.data.featuredImageUrl ? {
          images: {
            create: {
              imageUrl: result.data.featuredImageUrl,
            }
          }
        } : {}),
      },
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