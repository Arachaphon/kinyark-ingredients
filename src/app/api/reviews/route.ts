import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { createReviewSchema } from "@/lib/validations/review.schema"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = createReviewSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const review = await prisma.review.create({
      data: {
        recipeId: parsed.data.recipeId,
        userId: user.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        isAnonymous: parsed.data.isAnonymous,
      },
    })

    await prisma.recipe.update({
      where: { id: parsed.data.recipeId },
      data: {
        reviewCount: { increment: 1 },
      },
    })

    // Recalculate average rating
    const agg = await prisma.review.aggregate({
      where: { recipeId: parsed.data.recipeId },
      _avg: { rating: true },
    })
    await prisma.recipe.update({
      where: { id: parsed.data.recipe_id },
      data: { rating: agg._avg.rating ?? 0 },
    })

    return Response.json({ data: review }, { status: 201 })
  } catch (error) {
    console.error("Error creating review:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
