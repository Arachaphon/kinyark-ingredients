import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { cache, REC_CACHE_PREFIX } from "@/lib/cache"
import { getAuthUserId } from "@/lib/auth-user"

const uuid = z.string().uuid("Invalid ID")

const toggleSchema = z.object({
  recipeId: uuid.optional(),
  storePostId: uuid.optional(),
}).refine((v) => Boolean(v.recipeId) !== Boolean(v.storePostId), {
  message: "Provide exactly one of recipeId or storePostId",
})

// Visibility guard shared with the recipe/orphan detail endpoints:
// drafts/private are owner-only, protected is hidden from other STORE users.
async function assertStorePostVisible(
  sp: { userId: string; visibility: string },
  userId: string
): Promise<string | null> {
  if (sp.userId === userId) return null
  if (sp.visibility === "draft" || sp.visibility === "private") {
    return "Store post not found"
  }
  if (sp.visibility === "protected") {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    if (dbUser?.role === "STORE") return "Store post not found"
  }
  return null
}

export async function POST(request: Request) {
  const userId = await getAuthUserId(request)
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = toggleSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues.map((issue) => issue.message).join("; ") },
      { status: 400 }
    )
  }

  const { recipeId, storePostId } = parsed.data

  // Invalidate derived caches only AFTER a successful write; deleting beforehand
  // lets a concurrent GET repopulate the cache with stale counts.
  const invalidateCaches = async (targetRecipeId?: string) => {
    if (targetRecipeId) cache.del(`recipe:${targetRecipeId}`)
    cache.delPrefix("recipes:list")
    // Favorite changed → drop the sticky recommendation so it re-picks with the new signal.
    await prisma.searchHistory
      .deleteMany({ where: { userId, searchQuery: { startsWith: REC_CACHE_PREFIX } } })
      .catch(() => {})
  }

  // ---- Like / unlike a store set ----
  if (storePostId) {
    const sp = await prisma.storePost.findUnique({
      where: { id: storePostId },
      select: { id: true, userId: true, visibility: true },
    })
    if (!sp) return Response.json({ error: "Store post not found" }, { status: 404 })
    const blocked = await assertStorePostVisible(sp, userId)
    if (blocked) return Response.json({ error: blocked }, { status: 404 })

    try {
      await prisma.$transaction([
        prisma.favorite.create({
          data: { userId: userId, recipeId: null, storePostId: storePostId },
        }),
        prisma.storePost.update({
          where: { id: storePostId },
          data: { favoriteCount: { increment: 1 } },
        }),
      ])
      const favoriteCount = await prisma.favorite.count({ where: { storePostId } })
      await invalidateCaches()
      return Response.json({ data: { favorited: true, favoriteCount } }, { status: 201 })
    } catch (error) {
      // P2002 = duplicate (userId, storePostId) → already favorited → unlike.
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        await prisma.$transaction([
          prisma.favorite.delete({
            where: { userId_storePostId: { userId: userId, storePostId: storePostId } },
          }),
          prisma.storePost.update({
            where: { id: storePostId },
            data: { favoriteCount: { decrement: 1 } },
          }),
        ])
        const favoriteCount = await prisma.favorite.count({ where: { storePostId } })
        await invalidateCaches()
        return Response.json({ data: { favorited: false, favoriteCount } })
      }
      throw error
    }
  }

  // ---- Like / unlike a recipe (unchanged behavior) ----
  const rid = recipeId as string
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: rid },
      select: { id: true },
    })
    if (!recipe) return Response.json({ error: "Recipe not found" }, { status: 404 })

    // Atomic like: create favorite + increment count in 1 transaction.
    // Rely on the (userId, recipeId) unique constraint as the source of truth —
    // this is race-safe even when two toggle requests run concurrently.
    try {
      await prisma.$transaction([
        prisma.favorite.create({
          data: { userId: userId, recipeId: rid },
        }),
        prisma.recipe.update({
          where: { id: rid },
          data: { favoriteCount: { increment: 1 } },
        }),
      ])
      const favoriteCount = await prisma.favorite.count({ where: { recipeId: rid } })
      await invalidateCaches(rid)
      return Response.json({ data: { favorited: true, favoriteCount } }, { status: 201 })
    } catch (error) {
      // P2002 = duplicate (userId, recipeId) → already favorited → unlike.
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        await prisma.$transaction([
          prisma.favorite.delete({
            where: { userId_recipeId: { userId: userId, recipeId: rid } },
          }),
          prisma.recipe.update({
            where: { id: rid },
            data: { favoriteCount: { decrement: 1 } },
          }),
        ])
        const favoriteCount = await prisma.favorite.count({ where: { recipeId: rid } })
        await invalidateCaches(rid)
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
    const storePostId = searchParams.get("storePostId")
    const action = searchParams.get("action")

    if (recipeId || storePostId || action) {
      const parsed = z.object({
        recipeId: uuid.optional(),
        storePostId: uuid.optional(),
        action: z.enum(["status", "count"], {
          message: "Invalid action. Must be 'status' or 'count'",
        })
      }).refine((v) => Boolean(v.recipeId) !== Boolean(v.storePostId), {
        message: "Provide exactly one of recipeId or storePostId",
      }).safeParse({ recipeId, action })

      if (!parsed.success) {
        return Response.json(
          { error: parsed.error.issues.map(i => i.message).join("; ") },
          { status: 400 }
        )
      }

      const { recipeId: validatedRecipeId, storePostId: validatedStorePostId, action: validatedAction } = parsed.data

      if (validatedRecipeId) {
        const recipeExists = await prisma.recipe.findUnique({
          where: { id: validatedRecipeId }
        })
        if (!recipeExists) {
          return Response.json({ error: "Recipe not found" }, { status: 404 })
        }
      } else {
        const spExists = await prisma.storePost.findUnique({
          where: { id: validatedStorePostId as string }
        })
        if (!spExists) {
          return Response.json({ error: "Store post not found" }, { status: 404 })
        }
      }

      if (validatedAction === "status") {
        const userId = await getAuthUserId(request)
        if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

        const existing = validatedRecipeId
          ? await prisma.favorite.findUnique({
              where: { userId_recipeId: { userId: userId, recipeId: validatedRecipeId } }
            })
          : await prisma.favorite.findUnique({
              where: { userId_storePostId: { userId: userId, storePostId: validatedStorePostId as string } }
            })
        return Response.json({ data: { isFavorite: existing !== null } })
      }

      if (validatedAction === "count") {
        const count = validatedRecipeId
          ? await prisma.favorite.count({ where: { recipeId: validatedRecipeId } })
          : await prisma.favorite.count({ where: { storePostId: validatedStorePostId as string } })
        return Response.json({ data: { recipeId: validatedRecipeId, storePostId: validatedStorePostId, count } })
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
        storePostId: true,
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
            aiProvider: true,
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
        storePost: {
          select: {
            id: true,
            storeName: true,
            sellingPrice: true,
            favoriteCount: true,
            visibility: true,
            createdAt: true,
            images: {
              orderBy: { createdAt: "asc" },
              take: 1,
              select: { id: true, imageUrl: true },
            },
            user: {
              select: { id: true, username: true, avatarUrl: true },
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
