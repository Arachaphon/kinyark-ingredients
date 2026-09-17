import { prisma } from "@/lib/prisma";
import { createReviewSchema } from "@/lib/validations/review.schema";
import {
  DuplicateError,
  NotFoundError,
  ServiceValidationError,
} from "./errors";

export type ReviewDb = typeof prisma;

export interface AddReviewInput {
  recipeId: string;
  userId: string;
  rating: number;
  comment?: string;
  isAnonymous?: boolean;
}

/**
 * Add a review — mirrors POST /api/reviews:
 * validate input → recipe must exist → one review per user per recipe →
 * create + increment reviewCount + recalculate rating (rounded to 1 decimal).
 */
export async function addReview(input: AddReviewInput, db: ReviewDb = prisma) {
  const parsed = createReviewSchema.safeParse({
    recipeId: input.recipeId,
    rating: input.rating,
    comment: input.comment,
    isAnonymous: input.isAnonymous ?? false,
  });
  if (!parsed.success) {
    throw new ServiceValidationError(
      parsed.error.issues.map((i) => i.message).join("; "),
    );
  }

  const recipe = await db.recipe.findUnique({
    where: { id: input.recipeId },
    select: { id: true },
  });
  if (!recipe) throw new NotFoundError("Recipe not found");

  const existing = await db.review.findFirst({
    where: { recipeId: input.recipeId, userId: input.userId },
    select: { id: true },
  });
  if (existing) {
    throw new DuplicateError("You have already reviewed this recipe");
  }

  return db.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        recipeId: input.recipeId,
        userId: input.userId,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        isAnonymous: parsed.data.isAnonymous,
      },
    });
    await tx.recipe.update({
      where: { id: input.recipeId },
      data: { reviewCount: { increment: 1 } },
    });
    const newRating = await recalculateRecipeRating(input.recipeId, tx);
    void newRating;
    return created;
  });
}

/**
 * Recompute a recipe's average rating from all its reviews
 * (rounded to 1 decimal, same formula as POST /api/reviews).
 * Accepts the base client or a transaction client.
 */
export async function recalculateRecipeRating(
  recipeId: string,
  // oxlint-disable-next-line no-explicit-any
  db: any = prisma,
): Promise<number> {
  const agg = await db.review.aggregate({
    where: { recipeId },
    _avg: { rating: true },
  });
  const newRating = Math.round((agg._avg.rating ?? 0) * 10) / 10;
  await db.recipe.update({ where: { id: recipeId }, data: { rating: newRating } });
  return newRating;
}
