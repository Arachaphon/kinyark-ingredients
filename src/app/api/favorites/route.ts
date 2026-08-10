import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const favoriteSchema = z.object({
  recipeId: z.string({
    message: "Invalid recipe ID",
  }).uuid("Invalid recipe ID"),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = favoriteSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues.map((issue) => issue.message).join("; ") },
      { status: 400 }
    )
  }

  const { recipeId } = parsed.data

  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } })
  if (!recipe) return Response.json({ error: "Recipe not found" }, { status: 404 })

  try {
    const existing = await prisma.favorite.findUnique({
      where: { userId_recipeId: { userId: user.id, recipeId: recipeId } },
    })

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } })
      await prisma.recipe.update({
        where: { id: recipeId },
        data: { favoriteCount: { decrement: 1 } },
      })
      return Response.json({ data: { favorited: false } })
    }

    await prisma.favorite.create({
      data: { userId: user.id, recipeId: recipeId },
    })
    await prisma.recipe.update({
      where: { id: recipeId },
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
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
          recipeIngredients: {
            include: { ingredient: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return Response.json({ data: favorites })
}
