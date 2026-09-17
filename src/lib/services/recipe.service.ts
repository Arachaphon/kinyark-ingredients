import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  createRecipeSchema,
  updateRecipeSchema,
} from "@/lib/validations/recipe.schema";
import {
  ForbiddenError,
  NotFoundError,
  ServiceValidationError,
} from "./errors";

/** Injectable DB handle — defaults to the real Prisma client. Tests pass a manual mock. */
export type RecipeDb = typeof prisma;

const OWNER_SELECT = { userId: true } as const;

/**
 * Create a recipe owned by `userId`.
 * Scalar fields only — ingredient linking goes through
 * `upsertRecipeIngredients` (same split as POST /api/recipes).
 */
export async function createRecipe(
  userId: string,
  input: unknown,
  db: RecipeDb = prisma,
) {
  const parsed = createRecipeSchema.safeParse(input);
  if (!parsed.success) {
    throw new ServiceValidationError(
      parsed.error.issues.map((i) => i.message).join("; "),
    );
  }
  const { ingredients: _ingredients, store: _store, ...rest } =
    parsed.data as Record<string, unknown> & {
      ingredients: unknown;
      store?: unknown;
    };
  void _ingredients;
  void _store;
  const data = { ...(rest as Prisma.RecipeUncheckedCreateInput), userId };
  return db.recipe.create({ data });
}

/** Get a recipe by id (404 when missing). */
export async function getRecipeById(id: string, db: RecipeDb = prisma) {
  const recipe = await db.recipe.findUnique({ where: { id } });
  if (!recipe) throw new NotFoundError("Recipe not found");
  return recipe;
}

export interface ListRecipesOptions {
  page?: number;
  limit?: number;
}

/** Public recipe feed with pagination metadata. */
export async function listRecipes(
  options: ListRecipesOptions = {},
  db: RecipeDb = prisma,
) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const where = { visibility: "public" } as const;
  const [total, data] = await Promise.all([
    db.recipe.count({ where }),
    db.recipe.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return { data, total, page, limit };
}

async function assertOwner(id: string, userId: string, db: RecipeDb) {
  const recipe = await db.recipe.findUnique({
    where: { id },
    select: OWNER_SELECT,
  });
  if (!recipe) throw new NotFoundError("Recipe not found");
  if (recipe.userId !== userId) {
    throw new ForbiddenError("Only the owner can modify this recipe");
  }
}

/** Update a recipe — owner only. */
export async function updateRecipe(
  id: string,
  userId: string,
  input: unknown,
  db: RecipeDb = prisma,
) {
  await assertOwner(id, userId, db);
  const parsed = updateRecipeSchema.safeParse(input);
  if (!parsed.success) {
    throw new ServiceValidationError(
      parsed.error.issues.map((i) => i.message).join("; "),
    );
  }
  return db.recipe.update({
    where: { id },
    data: parsed.data as Prisma.RecipeUncheckedUpdateInput,
  });
}

/**
 * Delete a recipe — owner only.
 * Child rows (ingredients, reviews, favorites, images, weekly recs)
 * are removed by the DB via onDelete: Cascade in schema.prisma.
 */
export async function deleteRecipe(
  id: string,
  userId: string,
  db: RecipeDb = prisma,
) {
  await assertOwner(id, userId, db);
  return db.recipe.delete({ where: { id } });
}
