import { prisma } from "@/lib/prisma";
import { storeSchema } from "@/lib/validations/recipe.schema";
import {
  ForbiddenError,
  NotFoundError,
  ServiceValidationError,
} from "./errors";

export type StoreSetDb = typeof prisma;

export const STORE_VISIBILITY = ["public", "protected", "private", "draft"] as const;
export type StoreVisibility = (typeof STORE_VISIBILITY)[number];

/**
 * Create a marketplace store post for `userId`.
 * - sellingPrice is required and must be >= 0 (storeSchema).
 * - When recipeId is provided it must reference an existing recipe,
 *   otherwise the post is rejected (no orphan-by-mistake posts).
 * - setIngredients are stored as-is on the post (Json column).
 */
export async function createStorePost(
  userId: string,
  input: unknown,
  db: StoreSetDb = prisma,
) {
  const parsed = storeSchema.safeParse(input);
  if (!parsed.success) {
    throw new ServiceValidationError(
      parsed.error.issues.map((i) => i.message).join("; "),
    );
  }
  const {
    storeName,
    sellingPrice,
    storeDescription,
    storeLocation,
    contactInfo,
    setIngredients,
    recipeId,
    visibility,
  } = parsed.data;

  if (recipeId) {
    const recipe = await db.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true },
    });
    if (!recipe) {
      throw new NotFoundError("Recipe not found for the given recipeId");
    }
  }

  return db.storePost.create({
    data: {
      userId,
      recipeId: recipeId ?? null,
      storeName,
      sellingPrice,
      storeDescription: storeDescription ?? null,
      storeLocation: storeLocation ?? null,
      contactInfo: contactInfo ?? null,
      setIngredients: setIngredients ?? undefined,
      visibility: visibility ?? "public",
    },
  });
}

async function assertStoreOwner(id: string, userId: string, db: StoreSetDb) {
  const post = await db.storePost.findUnique({
    where: { id },
    select: { userId: true, visibility: true },
  });
  if (!post) throw new NotFoundError("Store post not found");
  if (post.userId !== userId) {
    throw new ForbiddenError("Only the owner can modify this store post");
  }
  return post;
}

/** Change a store post's visibility — owner only. */
export async function updateStorePostVisibility(
  id: string,
  userId: string,
  visibility: StoreVisibility,
  db: StoreSetDb = prisma,
) {
  await assertStoreOwner(id, userId, db);
  return db.storePost.update({ where: { id }, data: { visibility } });
}

/**
 * Sold-out rule: a public store post becomes private so it disappears
 * from public feeds while staying visible to its owner.
 * Non-public posts are returned unchanged.
 */
export async function markStorePostSoldOut(
  id: string,
  userId: string,
  db: StoreSetDb = prisma,
) {
  const post = await assertStoreOwner(id, userId, db);
  if (post.visibility !== "public") return post;
  return db.storePost.update({
    where: { id },
    data: { visibility: "private" },
  });
}
