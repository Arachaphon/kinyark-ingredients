/**
 * QA: Service Layer Tests
 * Tests for feature/service-layer checklist
 * Covers: recipeService, reviewService, favoriteService, userService, searchService
 *
 * NOTE: src/lib/services/ does NOT exist in this project yet (PLAN.md Phase 3.2 = 0/20 ❌).
 * All tests in this file are documented as PENDING (using test.todo) to accurately
 * reflect the implementation gap. They will be promoted to runnable tests once
 * the service layer is implemented.
 */

// ---------------------------------------------------------------------------
// recipeService
// ---------------------------------------------------------------------------
describe("recipeService", () => {
  test.todo("createRecipe() — creates a recipe and returns the created record");
  test.todo("getRecipeById() — returns a recipe with ingredients and reviews");
  test.todo("getRecipes() — returns paginated recipe feed");
  test.todo("updateRecipe() — updates recipe data and enforces owner check");
  test.todo("deleteRecipe() — deletes recipe and enforces owner check");
});

// ---------------------------------------------------------------------------
// reviewService
// ---------------------------------------------------------------------------
describe("reviewService", () => {
  test.todo("addReview() — adds a review to a recipe");
  test.todo("duplicate review blocked — throws if user already reviewed this recipe");
  test.todo("rating recalculated — updates recipe.rating after new review");
});

// ---------------------------------------------------------------------------
// favoriteService
// ---------------------------------------------------------------------------
describe("favoriteService", () => {
  test.todo("add favorite — saves a recipe to user favorites");
  test.todo("remove favorite — removes a recipe from user favorites");
  test.todo("get favorites — returns user's favorite recipes list");
});

// ---------------------------------------------------------------------------
// userService
// ---------------------------------------------------------------------------
describe("userService", () => {
  test.todo("get profile — returns user profile by userId");
  test.todo("update profile — updates username or avatar_url");
  test.todo("delete account — removes user and cascades all related data");
});

// ---------------------------------------------------------------------------
// searchService
// ---------------------------------------------------------------------------
describe("searchService", () => {
  test.todo("searchByQuery() — returns recipes matching a text query");
  test.todo("searchByIngredients() — returns recipes matching ingredient IDs");
  test.todo("saveSearchHistory() — persists search query for a user");
  test.todo("getSearchHistory() — returns saved search history for a user");
  test.todo("deleteSearchHistory() — deletes a specific history entry");
});
