import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: reviewId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const review = await prisma.review.findUnique({ where: { id: reviewId } })
  if (!review) return Response.json({ error: "Review not found" }, { status: 404 })

  try {
    const existing = await prisma.reviewLike.findUnique({
      where: { reviewId_userId: { reviewId, userId: user.id } },
    })

    if (existing) {
      await prisma.reviewLike.delete({ where: { id: existing.id } })
      return Response.json({ data: { liked: false } })
    }

    await prisma.reviewLike.create({
      data: { reviewId, userId: user.id },
    })
    return Response.json({ data: { liked: true } }, { status: 201 })
  } catch (error) {
    console.error("Error toggling review like:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
