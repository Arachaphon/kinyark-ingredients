import { prisma } from "@/lib/prisma"
import { updateReviewSchema } from "@/lib/validations/review.schema"
import { getAuthUserId } from "@/lib/auth-user"
import { cache } from "@/lib/cache"

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> | { id: string } },
) {
  const params = await props.params
  const id = params?.id
  const userId = await getAuthUserId(request)
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  if (!id) return Response.json({ error: "Invalid review ID" }, { status: 400 })
  const existing = await prisma.review.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })
  if (existing.userId !== userId) return Response.json({ error: "Forbidden" }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = updateReviewSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues.map((issue) => issue.message).join("; ") },
      { status: 400 }
    )
  }

  const { rating, comment, isAnonymous } = parsed.data

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const updatedReview = await tx.review.update({
        where: { id },
        data: {
          ...(rating !== undefined && { rating }),
          ...(comment !== undefined && { comment }),
          ...(isAnonymous !== undefined && { isAnonymous }),
        },
      })

      const agg = await tx.review.aggregate({
        where: { recipeId: existing.recipeId },
        _avg: { rating: true },
      })

      const newRating = Math.round((agg._avg.rating ?? 0) * 10) / 10

      await tx.recipe.update({
        where: { id: existing.recipeId },
        data: { rating: newRating },
      })

      return updatedReview
    })

    cache.del(`recipe:${existing.recipeId}`)

    return Response.json({ data: updated })
  } catch (error) {
    console.error("Error updating review:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> | { id: string } },
) {
  const params = await props.params
  const id = params?.id
  const userId = await getAuthUserId(request)
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  if (!id) return Response.json({ error: "Invalid review ID" }, { status: 400 })
  const existing = await prisma.review.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })
  if (existing.userId !== userId) return Response.json({ error: "Forbidden" }, { status: 403 })

  try {
    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id } })

      await tx.recipe.update({
        where: { id: existing.recipeId },
        data: {
          reviewCount: { decrement: 1 },
        },
      })

      const agg = await tx.review.aggregate({
        where: { recipeId: existing.recipeId },
        _avg: { rating: true },
      })

      const newRating = Math.round((agg._avg.rating ?? 0) * 10) / 10

      await tx.recipe.update({
        where: { id: existing.recipeId },
        data: { rating: newRating },
      })
    })

    cache.del(`recipe:${existing.recipeId}`)

    return Response.json({ data: { id } })
  } catch (error) {
    console.error("Error deleting review:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
