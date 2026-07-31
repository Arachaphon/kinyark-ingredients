import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const categoryId = searchParams.get("categoryId")
    const category = searchParams.get("category")
    const id = searchParams.get("id")

    const where: Prisma.IngredientWhereInput = {}
    if (id) {
      where.id = Number(id)
    }
    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      }
    }
    if (categoryId) {
      where.categoryId = Number(categoryId)
    } else if (category) {
      // Support filter by category name (e.g. ?category=Meat or ?category=ผัก)
      where.category = {
        name: {
          equals: category,
          mode: "insensitive",
        },
      }
    }

    const ingredients = await prisma.ingredient.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: "asc" },
    })

    return Response.json({ data: ingredients })
  } catch (error) {
    console.error("Error fetching ingredients:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
