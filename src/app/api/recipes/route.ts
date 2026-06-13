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
    const recipe = await prisma.recipe.create({
      data: {
        ...result.data,
        user_id: user.id,
      },
    })

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