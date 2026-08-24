import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { ingredientQuerySchema, createIngredientSchema } from "@/lib/validations/ingredient.schema"
import { cache, TTL_INGREDIENTS } from "@/lib/cache"

export const dynamic = "force-dynamic";

async function resolveCategoryId(category?: string, categoryId?: number): Promise<number | null> {
  if (categoryId !== undefined) return categoryId
  if (!category) return null

  const existing = await prisma.category.findFirst({
    where: { name: { equals: category, mode: "insensitive" } },
  })
  if (existing) return existing.id

  const created = await prisma.category.create({ data: { name: category } })
  return created.id
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = createIngredientSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues.map((issue) => issue.message).join("; ") },
        { status: 400 }
      )
    }

    const { name, category, categoryId } = parsed.data
    const resolvedCategoryId = await resolveCategoryId(category, categoryId)

    const existing = await prisma.ingredient.findUnique({
      where: { name },
      include: { category: true },
    })

    if (existing) {
      if (existing.categoryId !== resolvedCategoryId) {
        return Response.json(
          { error: `Ingredient "${name}" already exists under category "${existing.category?.name || "Others"}"` },
          { status: 400 }
        )
      }
      return Response.json({ data: existing }, { status: 200 })
    }

    const ingredient = await prisma.ingredient.create({
      data: { name, categoryId: resolvedCategoryId },
      include: { category: true },
    })

    cache.delPrefix('ingredient:')

    return Response.json({ data: ingredient }, { status: 200 })
  } catch (error) {
    console.error("Error creating ingredient:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    const cacheKey = `ingredient:${id ?? ''}:${categoryId ?? ''}:${category ?? ''}:${search ?? ''}`
    if (process.env.NODE_ENV !== 'test') {
      const cached = cache.get(cacheKey)
      if (cached) {
        return Response.json({ data: cached })
      }
    }

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

    cache.set(cacheKey, ingredients, TTL_INGREDIENTS)

    return Response.json({ data: ingredients })
  } catch (error) {
    console.error("Error fetching ingredients:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
