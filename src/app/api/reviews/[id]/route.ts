import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { createReviewSchema } from "@/lib/validations/review.schema"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const existing = await prisma.review.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })
  if (existing.userId !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json()
  const parsed = createReviewSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const updated = await prisma.review.update({
      where: { id },
      data: {
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        isAnonymous: parsed.data.isAnonymous,
      },
    })

    // Recalculate recipe rating
    const agg = await prisma.review.aggregate({
      where: { recipeId: existing.recipeId },
      _avg: { rating: true },
    })
    await prisma.recipe.update({
      where: { id: existing.recipeId },
      data: { rating: agg._avg.rating ?? 0 },
    })

    return Response.json({ data: updated })
  } catch (error) {
    console.error("Error updating review:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const existing = await prisma.review.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })
  if (existing.userId !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 })

  try {
    await prisma.review.delete({ where: { id } })

    await prisma.recipe.update({
      where: { id: existing.recipeId },
      data: {
        reviewCount: { decrement: 1 },
      },
    })

    const agg = await prisma.review.aggregate({
      where: { recipeId: existing.recipeId },
      _avg: { rating: true },
    })
    await prisma.recipe.update({
      where: { id: existing.recipeId },
      data: { rating: agg._avg.rating ?? 0 },
    })

    return Response.json({ data: { id } })
  } catch (error) {
    console.error("Error deleting review:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
