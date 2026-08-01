import { Prisma } from "@prisma/client"

// Cover image: the first uploaded image (same as featured feed)
export const recipeCoverImage = {
  orderBy: { createdAt: "asc" as const },
  take: 1,
  select: { id: true, imageUrl: true },
} as const satisfies Prisma.Recipe$imagesArgs

const recipeListFields = {
  id: true,
  recipeName: true,
  rating: true,
  favoriteCount: true,
  createdAt: true,
  bgColor: true,
  visibility: true,
} as const

// Standard select for recipe list items: core fields + cover image (+ optional author/ingredients)
export function recipeListItemSelect(
  opts: { withUser?: boolean; withIngredients?: boolean } = {}
): Prisma.RecipeSelect {
  return {
    ...recipeListFields,
    images: recipeCoverImage,
    ...(opts.withUser
      ? {
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
        }
      : {}),
    ...(opts.withIngredients
      ? {
          recipeIngredients: {
            select: {
              id: true,
              quantity: true,
              unit: true,
              ingredient: {
                select: { id: true, name: true, categoryId: true },
              },
            },
            orderBy: { ingredient: { name: "asc" } },
          },
        }
      : {}),
  }
}
