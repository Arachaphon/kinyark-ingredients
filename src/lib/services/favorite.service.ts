import { prisma } from "@/lib/prisma";
import {
  DuplicateError,
  NotFoundError,
  ServiceValidationError,
  isRecordNotFound,
  isUniqueViolation,
} from "./errors";

export type FavoriteDb = typeof prisma;

export interface FavoriteTarget {
  userId: string;
  recipeId?: string;
  storePostId?: string;
}

function assertExactlyOneTarget(target: FavoriteTarget): void {
  if (target.recipeId && target.storePostId) {
    throw new ServiceValidationError(
      "Provide exactly one of recipeId or storePostId",
    );
  }
  if (!target.recipeId && !target.storePostId) {
    // Legacy message kept for backward compatibility with POST /api/favorites.
    throw new ServiceValidationError("Invalid recipe ID");
  }
}

/**
 * Favorite a recipe or a store post — mirrors POST /api/favorites.
 * Uses the (userId, recipeId) / (userId, storePostId) unique constraints
 * as the race-safe source of truth (P2002 → DuplicateError).
 */
export async function addFavorite(
  target: FavoriteTarget,
  db: FavoriteDb = prisma,
) {
  assertExactlyOneTarget(target);

  if (target.recipeId) {
    const recipe = await db.recipe.findUnique({
      where: { id: target.recipeId },
      select: { id: true },
    });
    if (!recipe) throw new NotFoundError("Recipe not found");
    try {
      await db.$transaction([
        db.favorite.create({
          data: { userId: target.userId, recipeId: target.recipeId },
        }),
        db.recipe.update({
          where: { id: target.recipeId },
          data: { favoriteCount: { increment: 1 } },
        }),
      ]);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateError("Already favorited");
      }
      throw error;
    }
    const favoriteCount = await db.favorite.count({
      where: { recipeId: target.recipeId },
    });
    return { favorited: true as const, favoriteCount };
  }

  const storePostId = target.storePostId as string;
  const sp = await db.storePost.findUnique({
    where: { id: storePostId },
    select: { id: true },
  });
  if (!sp) throw new NotFoundError("Store post not found");
  try {
    await db.$transaction([
      db.favorite.create({
        data: { userId: target.userId, recipeId: null, storePostId },
      }),
      db.storePost.update({
        where: { id: storePostId },
        data: { favoriteCount: { increment: 1 } },
      }),
    ]);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DuplicateError("Already favorited");
    }
    throw error;
  }
  const favoriteCount = await db.favorite.count({ where: { storePostId } });
  return { favorited: true as const, favoriteCount };
}

/** Remove a favorite and decrement the target counter. */
export async function removeFavorite(
  target: FavoriteTarget,
  db: FavoriteDb = prisma,
) {
  assertExactlyOneTarget(target);

  if (target.recipeId) {
    try {
      await db.$transaction([
        db.favorite.delete({
          where: {
            userId_recipeId: { userId: target.userId, recipeId: target.recipeId },
          },
        }),
        db.recipe.update({
          where: { id: target.recipeId },
          data: { favoriteCount: { decrement: 1 } },
        }),
      ]);
    } catch (error) {
      if (isRecordNotFound(error)) throw new NotFoundError("Favorite not found");
      throw error;
    }
    const favoriteCount = await db.favorite.count({
      where: { recipeId: target.recipeId },
    });
    return { favorited: false as const, favoriteCount };
  }

  const storePostId = target.storePostId as string;
  try {
    await db.$transaction([
      db.favorite.delete({
        where: {
          userId_storePostId: { userId: target.userId, storePostId },
        },
      }),
      db.storePost.update({
        where: { id: storePostId },
        data: { favoriteCount: { decrement: 1 } },
      }),
    ]);
  } catch (error) {
    if (isRecordNotFound(error)) throw new NotFoundError("Favorite not found");
    throw error;
  }
  const favoriteCount = await db.favorite.count({ where: { storePostId } });
  return { favorited: false as const, favoriteCount };
}

/** List a user's favorites, newest first (mirrors GET /api/favorites). */
export async function listFavorites(userId: string, db: FavoriteDb = prisma) {
  return db.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
