import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      include: {
        subCategory: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return Response.json({ data: ingredients })
  } catch (error) {
    console.error("Error fetching ingredients:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
