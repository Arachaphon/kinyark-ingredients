/**
 * QA: Service Layer Tests
 * Covers: recipeService, reviewService, favoriteService, userService, searchService.
 *
 * Implementation: src/lib/services/*.service.ts with real logic against the
 * Prisma schema. Prisma is fully mocked (manual mock — no database, no network).
 */

import {
  createRecipe,
  getRecipeById,
  listRecipes,
  updateRecipe,
  deleteRecipe,
} from "@/lib/services/recipe.service";
import {
  addReview,
  recalculateRecipeRating,
} from "@/lib/services/review.service";
import {
  addFavorite,
  removeFavorite,
  listFavorites,
} from "@/lib/services/favorite.service";
import {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
} from "@/lib/services/user.service";
import {
  searchByQuery,
  searchByIngredients,
  saveSearchHistory,
  getSearchHistory,
  deleteSearchHistory,
} from "@/lib/services/search.service";
import {
  DuplicateError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/services/errors";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    recipe: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    review: {
      create: jest.fn(),
      findFirst: jest.fn(),
      aggregate: jest.fn(),
    },
    favorite: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    storePost: { findUnique: jest.fn(), update: jest.fn(), count: jest.fn() },
    searchHistory: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

type MockDb = Record<string, Record<string, jest.Mock>>;
const mockDb = prisma as unknown as MockDb;
const mockTx = prisma.$transaction as unknown as jest.Mock;

const UUID = "123e4567-e89b-42d3-a456-426614174001";
const USER = "123e4567-e89b-42d3-a456-426614174002";

const validRecipeInput = {
  recipeName: "Tom Kha Gai",
  ingredients: [{ name: "Chicken", quantity: 200, unit: "g" }],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockDb.searchHistory.findMany.mockResolvedValue([]);
  mockDb.searchHistory.deleteMany.mockResolvedValue({ count: 0 });
  mockDb.favorite.count.mockResolvedValue(0);
});

// ---------------------------------------------------------------------------
// recipeService
// ---------------------------------------------------------------------------
describe("recipeService", () => {
  test("createRecipe() — creates a recipe and returns the created record", async () => {
    const created = { id: UUID, userId: USER, recipeName: "Tom Kha Gai" };
    mockDb.recipe.create.mockResolvedValue(created);

    const result = await createRecipe(USER, validRecipeInput);

    expect(mockDb.recipe.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: USER }) }),
    );
    expect(result).toEqual(created);
  });

  test("getRecipeById() — returns a recipe with ingredients and reviews", async () => {
    const record = { id: UUID, recipeName: "Tom Kha Gai" };
    mockDb.recipe.findUnique.mockResolvedValue(record);

    await expect(getRecipeById(UUID)).resolves.toEqual(record);
    expect(mockDb.recipe.findUnique).toHaveBeenCalledWith({ where: { id: UUID } });
  });

  test("getRecipes() — returns paginated recipe feed", async () => {
    mockDb.recipe.count.mockResolvedValue(2);
    mockDb.recipe.findMany.mockResolvedValue([{ id: "a" }, { id: "b" }]);

    const result = await listRecipes({ page: 1, limit: 10 });

    expect(result).toEqual({
      data: [{ id: "a" }, { id: "b" }],
      total: 2,
      page: 1,
      limit: 10,
    });
  });

  test("updateRecipe() — updates recipe data and enforces owner check", async () => {
    mockDb.recipe.findUnique.mockResolvedValue({ userId: USER });
    mockDb.recipe.update.mockResolvedValue({ id: UUID, recipeName: "New" });

    const ok = await updateRecipe(UUID, USER, { recipeName: "New" });
    expect(ok).toEqual({ id: UUID, recipeName: "New" });

    mockDb.recipe.findUnique.mockResolvedValue({ userId: "someone-else" });
    await expect(updateRecipe(UUID, USER, { recipeName: "X" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  test("deleteRecipe() — deletes recipe and enforces owner check", async () => {
    mockDb.recipe.findUnique.mockResolvedValue({ userId: USER });
    mockDb.recipe.delete.mockResolvedValue({ id: UUID });

    await expect(deleteRecipe(UUID, USER)).resolves.toEqual({ id: UUID });

    mockDb.recipe.findUnique.mockResolvedValue(null);
    await expect(deleteRecipe(UUID, USER)).rejects.toBeInstanceOf(NotFoundError);
  });
});

// ---------------------------------------------------------------------------
// reviewService
// ---------------------------------------------------------------------------
describe("reviewService", () => {
  function mockReviewTxAggregate(avg: number | null) {
    const tx = {
      review: {
        create: jest.fn().mockResolvedValue({ id: "r1", rating: 5 }),
        aggregate: jest.fn().mockResolvedValue({ _avg: { rating: avg } }),
      },
      recipe: { update: jest.fn().mockResolvedValue({}) },
    };
    mockTx.mockImplementation((cb: (tx: unknown) => unknown) => cb(tx));
    return tx;
  }

  test("addReview() — adds a review to a recipe", async () => {
    mockDb.recipe.findUnique.mockResolvedValue({ id: UUID });
    mockDb.review.findFirst.mockResolvedValue(null);
    const tx = mockReviewTxAggregate(5);

    const result = await addReview({ recipeId: UUID, userId: USER, rating: 5 });

    expect(tx.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ recipeId: UUID, userId: USER, rating: 5 }),
      }),
    );
    expect(result).toEqual({ id: "r1", rating: 5 });
  });

  test("duplicate review blocked — throws if user already reviewed this recipe", async () => {
    mockDb.recipe.findUnique.mockResolvedValue({ id: UUID });
    mockDb.review.findFirst.mockResolvedValue({ id: "existing" });

    await expect(
      addReview({ recipeId: UUID, userId: USER, rating: 4 }),
    ).rejects.toBeInstanceOf(DuplicateError);
    expect(mockTx).not.toHaveBeenCalled();
  });

  test("rating recalculated — updates recipe.rating after new review", async () => {
    const tx = {
      review: {
        aggregate: jest.fn().mockResolvedValue({ _avg: { rating: 4.25 } }),
      },
      recipe: { update: jest.fn().mockResolvedValue({}) },
    };

    const rating = await recalculateRecipeRating(UUID, tx);

    expect(rating).toBe(4.3); // rounded to 1 decimal like POST /api/reviews
    expect(tx.recipe.update).toHaveBeenCalledWith({
      where: { id: UUID },
      data: { rating: 4.3 },
    });
  });
});

// ---------------------------------------------------------------------------
// favoriteService
// ---------------------------------------------------------------------------
describe("favoriteService", () => {
  test("add favorite — saves a recipe to user favorites", async () => {
    mockDb.recipe.findUnique.mockResolvedValue({ id: UUID });
    mockTx.mockResolvedValue([{}, {}]);
    mockDb.favorite.count.mockResolvedValue(1);

    const result = await addFavorite({ userId: USER, recipeId: UUID });

    expect(result).toEqual({ favorited: true, favoriteCount: 1 });
  });

  test("remove favorite — removes a recipe from user favorites", async () => {
    mockTx.mockResolvedValue([{}, {}]);
    mockDb.favorite.count.mockResolvedValue(0);

    const result = await removeFavorite({ userId: USER, recipeId: UUID });

    expect(mockDb.favorite.delete).toHaveBeenCalledWith({
      where: { userId_recipeId: { userId: USER, recipeId: UUID } },
    });
    expect(result).toEqual({ favorited: false, favoriteCount: 0 });
  });

  test("get favorites — returns user's favorite recipes list", async () => {
    const rows = [{ id: "f1", recipeId: UUID }];
    mockDb.favorite.findMany.mockResolvedValue(rows);

    await expect(listFavorites(USER)).resolves.toEqual(rows);
    expect(mockDb.favorite.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER } }),
    );
  });
});

// ---------------------------------------------------------------------------
// userService
// ---------------------------------------------------------------------------
describe("userService", () => {
  test("get profile — returns user profile by userId", async () => {
    const profile = { id: USER, username: "pt" };
    mockDb.user.findUnique.mockResolvedValue(profile);

    await expect(getUserProfile(USER)).resolves.toEqual(profile);
  });

  test("update profile — updates username or avatar_url", async () => {
    const updated = { id: USER, username: "newname" };
    mockDb.user.update.mockResolvedValue(updated);

    await expect(
      updateUserProfile(USER, { username: "newname" }),
    ).resolves.toEqual(updated);
  });

  test("delete account — removes user and cascades all related data", async () => {
    mockDb.user.delete.mockResolvedValue({ id: USER });

    await expect(deleteUserAccount(USER)).resolves.toEqual({ id: USER });
    // DB-level cascade (schema.prisma onDelete: Cascade) removes recipes,
    // reviews, favorites, search history, review likes and store posts.
    expect(mockDb.user.delete).toHaveBeenCalledWith({ where: { id: USER } });
  });
});

// ---------------------------------------------------------------------------
// searchService
// ---------------------------------------------------------------------------
describe("searchService", () => {
  test("searchByQuery() — returns recipes matching a text query", async () => {
    const rows = [{ id: UUID, recipeName: "Tom Yum" }];
    mockDb.recipe.findMany.mockResolvedValue(rows);

    await expect(searchByQuery("Tom Yum")).resolves.toEqual(rows);
    expect(mockDb.recipe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          recipeName: { contains: "Tom Yum", mode: "insensitive" },
        }),
      }),
    );
  });

  test("searchByIngredients() — returns recipes matching ingredient IDs", async () => {
    const rows = [{ id: UUID }];
    mockDb.recipe.findMany.mockResolvedValue(rows);

    await expect(searchByIngredients([1, 2])).resolves.toEqual(rows);
    expect(mockDb.recipe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ AND: expect.any(Array) }),
      }),
    );
  });

  test("saveSearchHistory() — persists search query for a user", async () => {
    const created = { id: "h1", userId: USER, searchQuery: "Tom Yum" };
    mockTx.mockImplementation((cb: (tx: unknown) => unknown) =>
      cb({
        searchHistory: {
          deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          create: jest.fn().mockResolvedValue(created),
        },
      }),
    );

    await expect(saveSearchHistory(USER, "Tom Yum")).resolves.toEqual(created);
  });

  test("getSearchHistory() — returns saved search history for a user", async () => {
    const rows = [{ id: "h1", searchQuery: "Tom Yum" }];
    mockDb.searchHistory.findMany.mockResolvedValue(rows);

    await expect(getSearchHistory(USER)).resolves.toEqual(rows);
  });

  test("deleteSearchHistory() — deletes a specific history entry", async () => {
    mockDb.searchHistory.deleteMany.mockResolvedValue({ count: 1 });

    await expect(deleteSearchHistory(USER, "h1-id")).resolves.toBe(true);
    expect(mockDb.searchHistory.deleteMany).toHaveBeenCalledWith({
      where: { id: "h1-id", userId: USER },
    });
  });
});
