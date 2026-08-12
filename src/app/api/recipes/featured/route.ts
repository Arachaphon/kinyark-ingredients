import { prisma } from "@/lib/prisma"
import { recipeListItemSelect } from "@/lib/recipes"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { cache, TTL_FEATURED } from "@/lib/cache"

export const dynamic = "force-dynamic";

const FEATURED_MARKER = "__featured__";
const DEFAULT_LIMIT = 6;

const featuredQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(DEFAULT_LIMIT),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = featuredQuerySchema.safeParse({
      limit: searchParams.get("limit") ?? undefined,
    })

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const limit = parsed.data.limit

    const userId = request.headers.get("x-user-id")
    const userRole = request.headers.get("x-user-role")
    const user = userId ? { id: userId, role: userRole } : null

    // If no logged in user, return top public recipes (0ms network cost caching since it's anonymous fallback)
    if (!user) {
      const cacheKey = 'featured:anon'
      const cached = cache.get(cacheKey)
      if (cached) {
        return Response.json({ data: cached, total: (cached as unknown[]).length, cursor: 0 })
      }
      const anonymousRecipes = await prisma.recipe.findMany({
        relationLoadStrategy: "join",
        where: { visibility: "public" },
        select: recipeListItemSelect(),
        orderBy: { favoriteCount: "desc" },
        take: limit,
      })
      cache.set(cacheKey, anonymousRecipes, TTL_FEATURED)
      return Response.json({ data: anonymousRecipes, total: anonymousRecipes.length, cursor: 0 })
    }

    // Check in-memory cache for logged-in user
    const userCacheKey = `featured:${user.id}:${limit}`
    const userCached = cache.get(userCacheKey)
    if (userCached) {
      return Response.json({ data: userCached, total: (userCached as unknown[]).length, cursor: 0 })
    }

    const todayStr = new Date().toISOString().split('T')[0]

    // 1. Check if we have a cache record for today
    const cacheRecord = await prisma.searchHistory.findFirst({
      where: {
        userId: user.id,
        searchQuery: { startsWith: "__rec_cache__:" }
      },
      orderBy: { createdAt: "desc" }
    })

    let targetIds: string[] = []

    if (cacheRecord) {
      try {
        const cacheData = JSON.parse(cacheRecord.searchQuery.replace("__rec_cache__:", ""))
        if (cacheData.date === todayStr && Array.isArray(cacheData.ids) && cacheData.ids.length > 0) {
          targetIds = cacheData.ids
        }
      } catch (e) {
        // parsing failed, will recalculate
      }
    }

    // 2. If no valid cache for today, calculate recommended recipe IDs based on 1-month history
    if (targetIds.length === 0) {
      const oneMonthAgo = new Date()
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)

      // Fetch search history (exclude internal markers)
      const histories = await prisma.searchHistory.findMany({
        where: {
          userId: user.id,
          createdAt: { gte: oneMonthAgo },
          NOT: {
            OR: [
              { searchQuery: FEATURED_MARKER },
              { searchQuery: { startsWith: "__rec_cache__:" } }
            ]
          }
        },
        select: { searchQuery: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      })

      const searchQueries = Array.from(
        new Set(
          histories
            .map((h) => h.searchQuery.trim().toLowerCase())
            .filter((q) => q.length > 1)
        )
      )

      let ingredientIds: number[] = []

      if (searchQueries.length > 0) {
        const matchedIngredients = await prisma.ingredient.findMany({
          where: {
            OR: searchQueries.map((query) => ({
              name: { contains: query, mode: "insensitive" as const },
            })),
          },
          select: { id: true },
          take: 20,
        })
        ingredientIds = matchedIngredients.map((i) => i.id)
      }

      let visibilityFilter: Prisma.RecipeWhereInput
      if (userRole === "STORE") {
        visibilityFilter = {
          OR: [
            { visibility: "public" },
            { userId: user.id },
          ],
        }
      } else {
        visibilityFilter = {
          OR: [
            { visibility: { in: ["public", "protected"] } },
            { userId: user.id },
          ],
        }
      }

      // Fetch recipes containing matched ingredients
      let matchedRecipes: { id: string }[] = []
      if (ingredientIds.length > 0) {
        matchedRecipes = await prisma.recipe.findMany({
          where: {
            ...visibilityFilter,
            recipeIngredients: {
              some: {
                ingredientId: { in: ingredientIds },
              },
            },
          },
          select: { id: true },
          orderBy: { favoriteCount: "desc" },
          take: 50,
        })
      }

      let calculatedIds = matchedRecipes.map((r) => r.id)

      // If we don't have enough matched recipes, fill with overall top-liked recipes
      if (calculatedIds.length < 50) {
        const fillRecipes = await prisma.recipe.findMany({
          where: {
            ...visibilityFilter,
            id: { notIn: calculatedIds },
          },
          select: { id: true },
          orderBy: { favoriteCount: "desc" },
          take: 50 - calculatedIds.length,
        })
        calculatedIds = [...calculatedIds, ...fillRecipes.map((r) => r.id)]
      }

      targetIds = calculatedIds.slice(0, limit)

      // Save to database cache
      const cacheVal = `__rec_cache__:${JSON.stringify({ date: todayStr, ids: targetIds })}`
      if (cacheRecord) {
        await prisma.searchHistory.update({
          where: { id: cacheRecord.id },
          data: { searchQuery: cacheVal, createdAt: new Date() },
        })
      } else {
        await prisma.searchHistory.create({
          data: {
            userId: user.id,
            searchQuery: cacheVal,
          },
        })
      }
    }

    // 3. Batch query the details for the target IDs using relationLoadStrategy join (runs in under 20ms)
    const featuredRecipes = await prisma.recipe.findMany({
      relationLoadStrategy: "join",
      where: { id: { in: targetIds } },
      select: recipeListItemSelect(),
    })

    // Sort to match the targetIds order
    const sortedRecipes = targetIds
      .map((id) => featuredRecipes.find((r) => r.id === id))
      .filter(Boolean)

    // Store in-memory cache for user
    cache.set(userCacheKey, sortedRecipes, TTL_FEATURED)

    return Response.json({
      data: sortedRecipes,
      total: sortedRecipes.length,
      cursor: 0,
    })
  } catch (error) {
    console.error("Error fetching featured recipes:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
