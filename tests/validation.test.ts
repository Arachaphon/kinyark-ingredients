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
    recipe_name: "Tom Kha Gai",
    ingredients: [{ name: "Chicken", quantity: 200, unit: "g" }],
  };

  test("recipe_name valid — accepts non-empty name", () => {
    const result = createRecipeSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  test("recipe_name วางแล้ว reject — rejects empty string", () => {
    const result = createRecipeSchema.safeParse({
      ...validBase,
      recipe_name: "",
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
  test("ingredient_id valid — accepts positive integer", () => {
    const result = ingredientIdSchema.safeParse({ ingredient_id: 42 });
    expect(result.success).toBe(true);
  });

  test("ingredient_id ติดลบ reject — rejects negative number", () => {
    const result = ingredientIdSchema.safeParse({ ingredient_id: -1 });
    expect(result.success).toBe(false);
  });

  test("ingredient_id เป็น string reject — rejects string value", () => {
    const result = ingredientIdSchema.safeParse({ ingredient_id: "abc" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// review.schema.ts
// ---------------------------------------------------------------------------
describe("review.schema.ts", () => {
  test("rating 1-5 ผ่าน — accepts rating of 3", () => {
    const result = createReviewSchema.safeParse({ rating: 3 });
    expect(result.success).toBe(true);
  });

  test("rating 0 reject — rejects rating below minimum", () => {
    const result = createReviewSchema.safeParse({ rating: 0 });
    expect(result.success).toBe(false);
  });

  test("rating 6 reject — rejects rating above maximum", () => {
    const result = createReviewSchema.safeParse({ rating: 6 });
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

  test("ingredient_ids valid — accepts array of positive integers", () => {
    const result = searchByIngredientsSchema.safeParse({
      ingredient_ids: [1, 2, 3],
    });
    expect(result.success).toBe(true);
  });

  test("invalid array reject — rejects array with non-integer items", () => {
    const result = searchByIngredientsSchema.safeParse({
      ingredient_ids: ["chicken", "rice"],
    });
    expect(result.success).toBe(false);
  });
});
