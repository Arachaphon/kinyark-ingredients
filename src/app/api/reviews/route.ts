import { prisma } from "@/lib/prisma"
import { createReviewSchema } from "@/lib/validations/review.schema"
import { getAuthUserId } from "@/lib/auth-user"

export async function POST(request: Request) {
  const userId = await getAuthUserId(request)
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

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
      where: { recipeId, userId: userId },
    })

    if (existingReview) {
      return Response.json({ error: "You have already reviewed this recipe" }, { status: 409 })
    }

    // 4. Perform database updates in transaction
    const review = await prisma.$transaction(async (tx) => {
      const createdReview = await tx.review.create({
        data: {
          recipeId,
          userId: userId,
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

      const newRating = Math.round((agg._avg.rating ?? 0) * 10) / 10
      await tx.recipe.update({
        where: { id: recipeId },
        data: { rating: newRating },
      })

      return createdReview
    })

    return Response.json({ data: review }, { status: 201 })
  } catch (error) {
    console.error("Error creating review:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
