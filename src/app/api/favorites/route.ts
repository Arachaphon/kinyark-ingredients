import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { recipe_id } = body
  if (!recipe_id || typeof recipe_id !== "string") {
    return Response.json({ error: "recipe_id is required" }, { status: 400 })
  }

  const recipe = await prisma.recipe.findUnique({ where: { id: recipe_id } })
  if (!recipe) return Response.json({ error: "Recipe not found" }, { status: 404 })

  try {
    const existing = await prisma.favorite.findUnique({
      where: { userId_recipeId: { userId: user.id, recipeId: recipe_id } },
    })

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } })
      await prisma.recipe.update({
        where: { id: recipe_id },
        data: { favoriteCount: { decrement: 1 } },
      })
      return Response.json({ data: { favorited: false } })
    }

    await prisma.favorite.create({
      data: { userId: user.id, recipeId: recipe_id },
    })
    await prisma.recipe.update({
      where: { id: recipe_id },
      data: { favoriteCount: { increment: 1 } },
    })
    return Response.json({ data: { favorited: true } }, { status: 201 })
  } catch (error) {
    console.error("Error toggling favorite:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      recipe: {
        include: {
          images: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return Response.json({ data: favorites })
}
