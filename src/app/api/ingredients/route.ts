import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { ingredientQuerySchema } from "@/lib/validations/ingredient.schema"

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const parsed = ingredientQuerySchema.safeParse({
      id: searchParams.get("id") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    })

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { id, categoryId, category, search } = parsed.data

    const where: Prisma.IngredientWhereInput = {
      ...(id !== undefined && { id }),
      ...(search !== undefined && {
        name: { contains: search, mode: "insensitive" },
      }),
      ...(categoryId !== undefined && { categoryId }),
      ...(category !== undefined && {
        category: {
          name: { equals: category, mode: "insensitive" },
        },
      }),
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
