/**
 * QA: Validation Schema Tests
 * Tests for feature/validation-schemas checklist
 * Covers: recipe.schema.ts, ingredient.schema.ts, review.schema.ts, search.schema.ts
 */

import { createRecipeSchema } from "@/lib/validations/recipe.schema";
import {
  ingredientIdSchema,
  createIngredientSchema,
  updateIngredientSchema,
} from "@/lib/validations/ingredient.schema";
import { createReviewSchema } from "@/lib/validations/review.schema";
import {
  searchQuerySchema,
  searchByIngredientsSchema,
} from "@/lib/validations/search.schema";

// ---------------------------------------------------------------------------
// recipe.schema.ts
// ---------------------------------------------------------------------------
describe("recipe.schema.ts", () => {
  const validBase = {
    recipeName: "Tom Kha Gai",
    ingredients: [{ name: "Chicken", quantity: 200, unit: "g" }],
  };

  test("recipeName valid — accepts non-empty name", () => {
    const result = createRecipeSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  test("recipeName empty reject — rejects empty string", () => {
    const result = createRecipeSchema.safeParse({
      ...validBase,
      recipeName: "",
    });
    expect(result.success).toBe(false);
  });

  test("ingredients วางแล้ว reject — rejects empty array", () => {
    const result = createRecipeSchema.safeParse({
      ...validBase,
      ingredients: [],
    });
    expect(result.success).toBe(false);
  });

  test("instructions valid — optional field passes when provided", () => {
    const result = createRecipeSchema.safeParse({
      ...validBase,
      instructions: "Step 1: Boil water. Step 2: Add chicken.",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.instructions).toBe(
        "Step 1: Boil water. Step 2: Add chicken."
      );
    }
  });

  test("recipeName too long reject", () => {
    const result = createRecipeSchema.safeParse({
      ...validBase,
      recipeName: "x".repeat(151),
    });
    expect(result.success).toBe(false);
  });

  test("featuredImageUrl invalid URL reject", () => {
    const result = createRecipeSchema.safeParse({
      ...validBase,
      featuredImageUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  test("featuredImageUrl valid URL pass", () => {
    const result = createRecipeSchema.safeParse({
      ...validBase,
      featuredImageUrl: "https://example.com/img.jpg",
    });
    expect(result.success).toBe(true);
  });

  test("quantity must be positive", () => {
    const result = createRecipeSchema.safeParse({
      ...validBase,
      ingredients: [{ name: "Chicken", quantity: -5, unit: "g" }],
    });
    expect(result.success).toBe(false);
  });

  test("visibility enum invalid reject", () => {
    const result = createRecipeSchema.safeParse({
      ...validBase,
      visibility: "secret",
    });
    expect(result.success).toBe(false);
  });

  test("store requires non-empty storeName", () => {
    const result = createRecipeSchema.safeParse({
      ...validBase,
      store: { storeName: "", sellingPrice: 10 },
    });
    expect(result.success).toBe(false);
  });

  test("store sellingPrice cannot be negative", () => {
    const result = createRecipeSchema.safeParse({
      ...validBase,
      store: { storeName: "Shop", sellingPrice: -5 },
    });
    expect(result.success).toBe(false);
  });

  test("systemRecipeId invalid uuid reject", () => {
    const result = createRecipeSchema.safeParse({
      ...validBase,
      systemRecipeId: "nope",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ingredient.schema.ts
// ---------------------------------------------------------------------------
describe("ingredient.schema.ts", () => {
  test("ingredientId valid — accepts positive integer", () => {
    const result = ingredientIdSchema.safeParse({ ingredientId: 42 });
    expect(result.success).toBe(true);
  });

  test("ingredientId negative reject — rejects negative number", () => {
    const result = ingredientIdSchema.safeParse({ ingredientId: -1 });
    expect(result.success).toBe(false);
  });

  test("ingredientId string reject — rejects string value", () => {
    const result = ingredientIdSchema.safeParse({ ingredientId: "abc" });
    expect(result.success).toBe(false);
  });

  test("createIngredient requires name", () => {
    const result = createIngredientSchema.safeParse({ category: "Meat" });
    expect(result.success).toBe(false);
  });

  test("createIngredient rejects both category and categoryId", () => {
    const result = createIngredientSchema.safeParse({
      name: "Chicken",
      category: "Meat",
      categoryId: 2,
    });
    expect(result.success).toBe(false);
  });

  test("updateIngredient rejects empty body", () => {
    const result = updateIngredientSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  test("updateIngredient accepts a single field", () => {
    const result = updateIngredientSchema.safeParse({ name: "Chicken Breast" });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// review.schema.ts
// ---------------------------------------------------------------------------
describe("review.schema.ts", () => {
const validReviewBase = { recipeId: "00000000-0000-0000-0000-000000000000" };

  test("rating 1-5 ผ่าน — accepts rating of 3", () => {
    const result = createReviewSchema.safeParse({ ...validReviewBase, rating: 3 });
    expect(result.success).toBe(true);
  });

  test("rating 0 reject — rejects rating below minimum", () => {
    const result = createReviewSchema.safeParse({ ...validReviewBase, rating: 0 });
    expect(result.success).toBe(false);
  });

  test("rating 6 reject — rejects rating above maximum", () => {
    const result = createReviewSchema.safeParse({ ...validReviewBase, rating: 6 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// search.schema.ts
// ---------------------------------------------------------------------------
describe("search.schema.ts", () => {
  test("query valid — accepts valid search string", () => {
    const result = searchQuerySchema.safeParse({ query: "Tom Yum" });
    expect(result.success).toBe(true);
  });

  test("ingredientIds valid — accepts array of positive integers", () => {
    const result = searchByIngredientsSchema.safeParse({
      ingredientIds: [1, 2, 3],
    });
    expect(result.success).toBe(true);
  });

  test("invalid array reject — rejects array with non-integer items", () => {
    const result = searchByIngredientsSchema.safeParse({
      ingredientIds: ["chicken", "rice"],
    });
    expect(result.success).toBe(false);
  });
});
