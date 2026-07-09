/**
 * QA: Validation Schema Tests
 * Tests for feature/validation-schemas checklist
 * Covers: recipe.schema.ts, ingredient.schema.ts, review.schema.ts, search.schema.ts
 */

import { createRecipeSchema } from "@/lib/validations/recipe.schema";
import {
  ingredientSchema,
  ingredientIdSchema,
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
