/**
 * Account Deletion Module — cascade integrity (SRS: ระบบลบบัญชี)
 * Covers: single user.delete call with DB-level cascade, and a contract test
 * asserting schema.prisma declares the expected onDelete behaviors:
 * Cascade for user-owned rows, SetNull for optional recipe references.
 *
 * Implementation: src/lib/services/account-deletion.service.ts.
 */

import * as fs from "fs";
import * as path from "path";
import {
  SET_NULL_REFERENCES,
  USER_CASCADE_DELETE_MODELS,
  deleteUserAccount,
} from "@/lib/services/account-deletion.service";
import { NotFoundError } from "@/lib/services/errors";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: { user: { delete: jest.fn() } },
}));

const mockDelete = (prisma.user.delete as unknown) as jest.Mock;
const USER = "123e4567-e89b-42d3-a456-426614174002";

function readSchema(): string {
  return fs.readFileSync(
    path.join(__dirname, "..", "..", "prisma", "schema.prisma"),
    "utf8",
  );
}

/** Extract the body of `model <name> { ... }` from the schema text. */
function modelBlock(schema: string, name: string): string {
  const match = schema.match(new RegExp(`model ${name} \\{([\\s\\S]*?)\\n\\}`));
  if (!match) throw new Error(`model ${name} not found in schema.prisma`);
  return match[1];
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Account Deletion — delete operation", () => {
  test("ลบ user ด้วย user.delete ครั้งเดียว (cascade เกิดที่ DB)", async () => {
    mockDelete.mockResolvedValue({ id: USER });

    await expect(deleteUserAccount(USER)).resolves.toEqual({ id: USER });
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: USER } });
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  test("ลบ user ที่ไม่มีอยู่จริง (P2025) → NotFoundError", async () => {
    mockDelete.mockRejectedValue({ code: "P2025" });

    await expect(deleteUserAccount(USER)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("Account Deletion — schema cascade contract", () => {
  test("ลบ User แล้วต้อง cascade ลบ Recipe, Review, Favorite, SearchHistory, ReviewLike, StorePost", () => {
    const schema = readSchema();
    expect([...USER_CASCADE_DELETE_MODELS]).toEqual([
      "Recipe",
      "Review",
      "Favorite",
      "SearchHistory",
      "ReviewLike",
      "StorePost",
    ]);

    // Every owned row points back to its parent with onDelete: Cascade.
    expect(modelBlock(schema, "Recipe")).toMatch(/user\s+User\s+@relation\([^)]*onDelete:\s*Cascade/);
    expect(modelBlock(schema, "Review")).toMatch(/user\s+User\s+@relation\([^)]*onDelete:\s*Cascade/);
    expect(modelBlock(schema, "Review")).toMatch(/recipe\s+Recipe\s+@relation\([^)]*onDelete:\s*Cascade/);
    expect(modelBlock(schema, "Favorite")).toMatch(/user\s+User\s+@relation\([^)]*onDelete:\s*Cascade/);
    expect(modelBlock(schema, "Favorite")).toMatch(/recipe\s+Recipe\?\s+@relation\([^)]*onDelete:\s*Cascade/);
    expect(modelBlock(schema, "Favorite")).toMatch(/storePost\s+StorePost\?\s+@relation\([^)]*onDelete:\s*Cascade/);
    expect(modelBlock(schema, "SearchHistory")).toMatch(/user\s+User\s+@relation\([^)]*onDelete:\s*Cascade/);
    expect(modelBlock(schema, "ReviewLike")).toMatch(/review\s+Review\s+@relation\([^)]*onDelete:\s*Cascade/);
    expect(modelBlock(schema, "ReviewLike")).toMatch(/user\s+User\s+@relation\([^)]*onDelete:\s*Cascade/);
    expect(modelBlock(schema, "StorePost")).toMatch(/user\s+User\s+@relation\([^)]*onDelete:\s*Cascade/);
  });

  test("referenceRecipeId เป็น SetNull — ลบ recipe ต้นทางไม่ error", () => {
    const schema = readSchema();
    expect(modelBlock(schema, "Recipe")).toMatch(
      /referenceRecipe\s+Recipe\?\s+@relation\([^)]*onDelete:\s*SetNull/,
    );
  });

  test("StorePost.recipeId และ IngredientPairRecipe.recipeId เป็น SetNull", () => {
    const schema = readSchema();
    expect(SET_NULL_REFERENCES.map((r) => `${r.model}.${r.field}`)).toEqual([
      "Recipe.referenceRecipeId",
      "StorePost.recipeId",
      "IngredientPairRecipe.recipeId",
    ]);
    expect(modelBlock(schema, "StorePost")).toMatch(
      /recipe\s+Recipe\?\s+@relation\([^)]*onDelete:\s*SetNull/,
    );
    expect(modelBlock(schema, "IngredientPairRecipe")).toMatch(
      /recipe\s+Recipe\?\s+@relation\([^)]*onDelete:\s*SetNull/,
    );
  });
});
