import { prisma } from "@/lib/prisma";
import {
  searchByIngredientsSchema,
  searchQuerySchema,
} from "@/lib/validations/search.schema";
import { ServiceValidationError } from "./errors";
import {
  clearAllSearchHistory as clearHistory,
  deleteSearchHistoryById,
  getSearchHistory as getHistory,
  saveSearchHistory as saveHistory,
} from "./searchHistoryService";

export type SearchDb = typeof prisma;

const PUBLIC_RECIPE = { visibility: "public" } as const;

/** Text search over public recipe names (case-insensitive). */
export async function searchByQuery(query: string, db: SearchDb = prisma) {
  const parsed = searchQuerySchema.safeParse({ query });
  if (!parsed.success) {
    throw new ServiceValidationError(
      parsed.error.issues.map((i) => i.message).join("; "),
    );
  }
  return db.recipe.findMany({
    where: {
      ...PUBLIC_RECIPE,
      recipeName: { contains: parsed.data.query, mode: "insensitive" },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

/** Ingredient search — every requested ingredient must be in the recipe. */
export async function searchByIngredients(
  ingredientIds: number[],
  db: SearchDb = prisma,
) {
  const parsed = searchByIngredientsSchema.safeParse({ ingredientIds });
  if (!parsed.success) {
    throw new ServiceValidationError(
      parsed.error.issues.map((i) => i.message).join("; "),
    );
  }
  return db.recipe.findMany({
    where: {
      ...PUBLIC_RECIPE,
      AND: parsed.data.ingredientIds.map((id) => ({
        recipeIngredients: { some: { ingredientId: id } },
      })),
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

/**
 * Search-history operations delegate to the production implementation
 * (src/lib/services/searchHistoryService.ts) so unit tests guard the
 * real behavior: trim/dedup, 1-month expiry, 20-row cap, marker hiding.
 */
export async function saveSearchHistory(userId: string, searchQuery: string) {
  const parsed = (
    await import("@/lib/validations/search.schema")
  ).saveSearchHistorySchema.safeParse({ searchQuery });
  if (!parsed.success) {
    throw new ServiceValidationError(
      parsed.error.issues.map((i) => i.message).join("; "),
    );
  }
  return saveHistory(userId, parsed.data.searchQuery);
}

export async function getSearchHistory(userId: string, limit = 20) {
  return getHistory(userId, limit);
}

export async function deleteSearchHistory(userId: string, historyId: string) {
  const deleted = await deleteSearchHistoryById(userId, historyId);
  if (!deleted) {
    const { NotFoundError } = await import("./errors");
    throw new NotFoundError("Search history not found");
  }
  return true;
}

export async function clearSearchHistory(userId: string) {
  return clearHistory(userId);
}
