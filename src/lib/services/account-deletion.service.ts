import { prisma } from "@/lib/prisma";
import { NotFoundError, isRecordNotFound } from "./errors";

export type AccountDeletionDb = typeof prisma;

/**
 * Models that MUST disappear with the user.
 * Declared as onDelete: Cascade on the child side in schema.prisma:
 * Recipe.user, Review.user, Review.recipe, Favorite.user, Favorite.recipe,
 * Favorite.storePost, SearchHistory.user, ReviewLike.user, ReviewLike.review,
 * StorePost.user.
 */
export const USER_CASCADE_DELETE_MODELS = [
  "Recipe",
  "Review",
  "Favorite",
  "SearchHistory",
  "ReviewLike",
  "StorePost",
] as const;

/**
 * References that MUST be nulled (not error) when the parent row is deleted.
 * Declared as onDelete: SetNull in schema.prisma.
 */
export const SET_NULL_REFERENCES = [
  { model: "Recipe", field: "referenceRecipeId", parent: "Recipe" },
  { model: "StorePost", field: "recipeId", parent: "Recipe" },
  { model: "IngredientPairRecipe", field: "recipeId", parent: "Recipe" },
] as const;

/**
 * Delete a user account. All owned rows cascade at the database level
 * (same single call as DELETE /api/auth/delete-account:
 * `prisma.user.delete({ where: { id } })`). Supabase Auth / Storage
 * cleanup stays in the route — this service covers DB integrity.
 */
export async function deleteUserAccount(
  userId: string,
  db: AccountDeletionDb = prisma,
) {
  try {
    return await db.user.delete({ where: { id: userId } });
  } catch (error) {
    if (isRecordNotFound(error)) throw new NotFoundError("User not found");
    throw error;
  }
}
