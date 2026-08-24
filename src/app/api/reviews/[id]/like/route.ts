import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: reviewId } = await params
  const userId = request.headers.get("x-user-id")
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const review = await prisma.review.findUnique({ where: { id: reviewId } })
  if (!review) return Response.json({ error: "Review not found" }, { status: 404 })

  try {
    const existing = await prisma.reviewLike.findUnique({
      where: { reviewId_userId: { reviewId, userId: userId } },
    })

    if (existing) {
      await prisma.reviewLike.delete({ where: { id: existing.id } })
      return Response.json({ data: { liked: false } })
    }

    await prisma.reviewLike.create({
      data: { reviewId, userId: userId },
    })
    return Response.json({ data: { liked: true } }, { status: 201 })
  } catch (error) {
    console.error("Error toggling review like:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
