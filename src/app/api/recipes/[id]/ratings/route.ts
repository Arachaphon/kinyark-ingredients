import { prisma } from "@/lib/prisma"
import { recipeIdParamSchema } from "@/lib/validations/recipe.schema"

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

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, rating: true, reviewCount: true },
    })

    if (!recipe) {
      return Response.json({ error: "Recipe not found" }, { status: 404 })
    }

    const groups = await prisma.review.groupBy({
      by: ["rating"],
      where: { recipeId },
      _count: { rating: true },
    })

    const breakdown = {
      "5": 0,
      "4": 0,
      "3": 0,
      "2": 0,
      "1": 0,
    }

    groups.forEach((g) => {
      if (g.rating >= 1 && g.rating <= 5) {
        breakdown[g.rating.toString() as keyof typeof breakdown] = g._count.rating
      }
    })

    return Response.json({
      data: {
        recipeId,
        averageRating: recipe.rating,
        totalReviews: recipe.reviewCount,
        breakdown,
      },
    })
  } catch (error) {
    console.error("GET /api/recipes/[id]/ratings error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
