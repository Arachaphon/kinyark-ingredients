import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { cache, REC_CACHE_PREFIX } from "@/lib/cache"
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

  // Invalidate derived caches only AFTER a successful write; deleting beforehand
  // lets a concurrent GET repopulate the cache with stale counts.
  const invalidateCaches = async () => {
    cache.del(`recipe:${recipeId}`)
    cache.delPrefix("recipes:list")
    // Favorite changed → drop the sticky recommendation so it re-picks with the new signal.
    await prisma.searchHistory
      .deleteMany({ where: { userId, searchQuery: { startsWith: REC_CACHE_PREFIX } } })
      .catch(() => {})
  }

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true },
    })
    if (!recipe) return Response.json({ error: "Recipe not found" }, { status: 404 })

    // Atomic like: create favorite + increment count in 1 transaction.
    // Rely on the (userId, recipeId) unique constraint as the source of truth —
    // this is race-safe even when two toggle requests run concurrently.
    try {
      await prisma.$transaction([
        prisma.favorite.create({
          data: { userId: userId, recipeId: recipeId },
        }),
        prisma.recipe.update({
          where: { id: recipeId },
          data: { favoriteCount: { increment: 1 } },
        }),
      ])
      const favoriteCount = await prisma.favorite.count({ where: { recipeId } })
      await invalidateCaches()
      return Response.json({ data: { favorited: true, favoriteCount } }, { status: 201 })
    } catch (error) {
      // P2002 = duplicate (userId, recipeId) → already favorited → unlike.
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        await prisma.$transaction([
          prisma.favorite.delete({
            where: { userId_recipeId: { userId: userId, recipeId: recipeId } },
          }),
          prisma.recipe.update({
            where: { id: recipeId },
            data: { favoriteCount: { decrement: 1 } },
          }),
        ])
        const favoriteCount = await prisma.favorite.count({ where: { recipeId } })
        await invalidateCaches()
        return Response.json({ data: { favorited: false, favoriteCount } })
      }
      throw error
    }
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

    // No caching here: per-user data that can change from any serverless instance.
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

    return Response.json({ data: favorites })
  } catch (error) {
    console.error("GET /api/favorites error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
