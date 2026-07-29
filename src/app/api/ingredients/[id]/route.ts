import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params
    const id = Number(resolvedParams.id)

    if (isNaN(id)) {
      return Response.json({ error: "Invalid ingredient ID" }, { status: 400 })
    }

    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
      include: {
        category: true,
      },
    })

    if (!ingredient) {
      return Response.json({ error: "Ingredient not found" }, { status: 404 })
    }

    return Response.json({ data: ingredient })
  } catch (error) {
    console.error("Error fetching ingredient by ID:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
