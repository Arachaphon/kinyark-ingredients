import type { Prisma } from "@prisma/client"

export async function upsertRecipeIngredients(
  tx: Prisma.TransactionClient,
  ingredients: { name: string; category?: string }[]
): Promise<Array<{ id: number }>> {
  // 1. Load categories once (case-insensitive map) instead of N× findFirst queries
  const categories = await tx.category.findMany()
  const categoryNameToId = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]))

  // 2. Upsert all ingredients in parallel (single query each)
  return Promise.all(
    ingredients.map((ingredient) => {
      const categoryId = ingredient.category
        ? categoryNameToId.get(ingredient.category.toLowerCase())
        : undefined
      return tx.ingredient.upsert({
        where: { name: ingredient.name },
        update: {},
        create: {
          name: ingredient.name,
          ...(categoryId ? { categoryId } : {}),
        },
      })
    })
  )
}