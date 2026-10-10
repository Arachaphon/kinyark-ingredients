import { prisma } from "@/lib/prisma";
import { NotFoundError } from "./errors";

export type RecipeDetailDb = typeof prisma;

export interface StoreBanner {
  storePostId: string;
  storeName: string;
  sellingPrice: number;
  storeDescription: string | null;
  storeLocation: string | null;
  contactInfo: string | null;
  visibility: string;
}

/**
 * Recipe detail with marketplace banner (SRS: Recipe Detail Module).
 * A store-set banner is shown IFF the recipe has at least one PUBLIC
 * store post linked — drafts/private posts never leak to the detail view
 * (same visibility rule as recipeListItemSelect in src/lib/recipes.ts).
 */
export async function getRecipeDetail(
  recipeId: string,
  db: RecipeDetailDb = prisma,
) {
  const recipe = (await db.recipe.findUnique({
    where: { id: recipeId },
    include: {
      storePosts: {
        where: { visibility: "public" },
        take: 1,
        select: {
          id: true,
          storeName: true,
          sellingPrice: true,
          storeDescription: true,
          storeLocation: true,
          contactInfo: true,
          visibility: true,
        },
      },
    },
  }) as (Record<string, unknown> & {
    storePosts: Array<Record<string, unknown>>;
  }) | null);

  if (!recipe) throw new NotFoundError("Recipe not found");

  const linked = recipe.storePosts[0] ?? null;
  const storeBanner: StoreBanner | null = linked
    ? {
        storePostId: linked["id"] as string,
        storeName: linked["storeName"] as string,
        sellingPrice: linked["sellingPrice"] as number,
        storeDescription: (linked["storeDescription"] as string | null) ?? null,
        storeLocation: (linked["storeLocation"] as string | null) ?? null,
        contactInfo: (linked["contactInfo"] as string | null) ?? null,
        visibility: linked["visibility"] as string,
      }
    : null;

  return { recipe, storeBanner, hasStoreBanner: storeBanner !== null };
}
