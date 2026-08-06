import { prisma } from "@/lib/prisma"
import { ingredientParamSchema, updateIngredientSchema } from "@/lib/validations/ingredient.schema"

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params
    const parsedId = ingredientParamSchema.safeParse({ id: resolvedParams.id })

    if (!parsedId.success) {
      return Response.json({ error: "Invalid ingredient ID" }, { status: 400 })
    }

    const id = parsedId.data.id

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params
    const parsedId = ingredientParamSchema.safeParse({ id: resolvedParams.id })

    if (!parsedId.success) {
      return Response.json({ error: "Invalid ingredient ID" }, { status: 400 })
    }

    const id = parsedId.data.id

    const existing = await prisma.ingredient.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: "Ingredient not found" }, { status: 404 })
    }

    const body = await request.json()
    const parsedBody = updateIngredientSchema.safeParse(body)

    if (!parsedBody.success) {
      return Response.json(
        { error: parsedBody.error.issues.map((issue) => issue.message).join("; ") },
        { status: 400 }
      )
    }

    const { name, category, categoryId } = parsedBody.data
    const resolvedCategoryId = await resolveCategoryId(category, categoryId)

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined || categoryId !== undefined ? { categoryId: resolvedCategoryId } : {}),
      },
      include: { category: true },
    })

    return Response.json({ data: ingredient })
  } catch (error) {
    console.error("Error updating ingredient:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params
    const parsedId = ingredientParamSchema.safeParse({ id: resolvedParams.id })

    if (!parsedId.success) {
      return Response.json({ error: "Invalid ingredient ID" }, { status: 400 })
    }

    const id = parsedId.data.id

    const existing = await prisma.ingredient.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: "Ingredient not found" }, { status: 404 })
    }

    const usage = await prisma.recipeIngredient.count({ where: { ingredientId: id } })
    if (usage > 0) {
      return Response.json(
        { error: "Ingredient is used in recipes and cannot be deleted" },
        { status: 409 }
      )
    }

    await prisma.ingredient.delete({ where: { id } })
    return Response.json({ data: { success: true, id } })
  } catch (error) {
    console.error("Error deleting ingredient:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
