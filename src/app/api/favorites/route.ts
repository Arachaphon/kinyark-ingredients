import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { cache } from "@/lib/cache"
import { getAuthUserId } from "@/lib/auth-user"

const favoriteSchema = z.object({
  recipeId: z.string({
    message: "Invalid recipe ID",
  }).uuid("Invalid recipe ID"),
})

export async function POST(request: Request) {
  const userId = await getAuthUserId(request)
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

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
    cache.del(`favorites:${userId}`)
    cache.del(`recipe:${recipeId}`)
    const existing = await prisma.favorite.findUnique({
      where: { userId_recipeId: { userId: userId, recipeId: recipeId } },
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
      data: { userId: userId, recipeId: recipeId },
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

export async function GET(request?: Request) {
  try {
    const searchParams = request ? new URL(request.url).searchParams : new URLSearchParams()
    const recipeId = searchParams.get("recipeId")
    const action = searchParams.get("action")

    if (recipeId || action) {
      const parsed = z.object({
        recipeId: z.string({
          message: "Invalid recipe ID",
        }).uuid("Invalid recipe ID"),
        action: z.enum(["status", "count"], {
          message: "Invalid action. Must be 'status' or 'count'",
        })
      }).safeParse({ recipeId, action })

      if (!parsed.success) {
        return Response.json(
          { error: parsed.error.issues.map(i => i.message).join("; ") },
          { status: 400 }
        )
      }

      const { recipeId: validatedRecipeId, action: validatedAction } = parsed.data

      const recipeExists = await prisma.recipe.findUnique({
        where: { id: validatedRecipeId }
      })
      if (!recipeExists) {
        return Response.json({ error: "Recipe not found" }, { status: 404 })
      }

      if (validatedAction === "status") {
        const userId = await getAuthUserId(request)
        if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

        const existing = await prisma.favorite.findUnique({
          where: { userId_recipeId: { userId: userId, recipeId: validatedRecipeId } }
        })
        return Response.json({ data: { isFavorite: existing !== null } })
      }

      if (validatedAction === "count") {
        const count = await prisma.favorite.count({
          where: { recipeId: validatedRecipeId }
        })
        return Response.json({ data: { recipeId: validatedRecipeId, count } })
      }
    }

    const userId = await getAuthUserId(request)
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

    if (process.env.NODE_ENV !== 'test') {
      const cacheKey = `favorites:${userId}`
      const cached = cache.get(cacheKey)
      if (cached) {
        return Response.json({ data: cached })
      }
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: userId },
      select: {
        id: true,
        userId: true,
        recipeId: true,
        createdAt: true,
        recipe: {
          select: {
            id: true,
            recipeName: true,
            rating: true,
            favoriteCount: true,
            createdAt: true,
            bgColor: true,
            visibility: true,
            images: {
              orderBy: { createdAt: "asc" },
              take: 1,
              select: { id: true, imageUrl: true },
            },
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
            recipeIngredients: {
              select: {
                id: true,
                quantity: true,
                unit: true,
                ingredient: {
                  select: { id: true, name: true, categoryId: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    if (process.env.NODE_ENV !== 'test') {
      cache.set(`favorites:${userId}`, favorites, 30_000)
    }
    return Response.json({ data: favorites })
  } catch (error) {
    console.error("GET /api/favorites error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
