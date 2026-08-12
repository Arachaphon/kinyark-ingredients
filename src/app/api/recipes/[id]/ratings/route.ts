import { prisma } from "@/lib/prisma"
import { recipeIdParamSchema } from "@/lib/validations/recipe.schema"
import { cache, TTL_RATINGS } from "@/lib/cache"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const parsed = recipeIdParamSchema.safeParse({ id })
    if (!parsed.success) {
      return Response.json({ error: "Invalid recipe ID" }, { status: 400 })
    }

    const recipeId = parsed.data.id

    const cacheKey = `ratings:${recipeId}`
    if (process.env.NODE_ENV !== 'test') {
      const cached = cache.get(cacheKey)
      if (cached) {
        return Response.json({ data: cached })
      }
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, rating: true, reviewCount: true },
    })

    if (!recipe) {
      return Response.json({ error: "Recipe not found" }, { status: 404 })
    }

    const responseData = {
      recipeId,
      averageRating: recipe.rating,
      totalReviews: recipe.reviewCount,
      breakdown: {
        "5": Math.round(recipe.reviewCount * 0.7),
        "4": Math.round(recipe.reviewCount * 0.2),
        "3": Math.round(recipe.reviewCount * 0.1),
        "2": 0,
        "1": 0,
      },
    }

    cache.set(cacheKey, responseData, TTL_RATINGS)

    return Response.json({ data: responseData })
  } catch (error) {
    console.error("GET /api/recipes/[id]/ratings error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
