import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { createReviewSchema } from "@/lib/validations/review.schema"

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

  const parsed = createReviewSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues.map((issue) => issue.message).join("; ") },
      { status: 400 }
    )
  }

  const { recipeId, rating, comment, isAnonymous } = parsed.data

  try {
    // 1. Verify recipe exists and get owner id
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    })

    if (!recipe) {
      return Response.json({ error: "Recipe not found" }, { status: 404 })
    }


    // 3. Prevent duplicate reviews
    const existingReview = await prisma.review.findFirst({
      where: { recipeId, userId: user.id },
    })

    if (existingReview) {
      return Response.json({ error: "You have already reviewed this recipe" }, { status: 409 })
    }

    // 4. Perform database updates in transaction
    const review = await prisma.$transaction(async (tx) => {
      const createdReview = await tx.review.create({
        data: {
          recipeId,
          userId: user.id,
          rating,
          comment,
          isAnonymous,
        },
      })

      await tx.recipe.update({
        where: { id: recipeId },
        data: {
          reviewCount: { increment: 1 },
        },
      })

      const agg = await tx.review.aggregate({
        where: { recipeId },
        _avg: { rating: true },
      })

      await tx.recipe.update({
        where: { id: recipeId },
        data: { rating: agg._avg.rating ?? 0 },
      })

      return createdReview
    })

    return Response.json({ data: review }, { status: 201 })
  } catch (error) {
    console.error("Error creating review:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
