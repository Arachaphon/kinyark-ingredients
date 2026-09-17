/**
 * Recipe Detail Module (SRS: หน้ารายละเอียดสูตร + store-set banner)
 * Covers: banner shown iff a PUBLIC store post is linked; hidden otherwise.
 *
 * Implementation: src/lib/services/recipe-detail.service.ts (mocked Prisma).
 */

import { getRecipeDetail } from "@/lib/services/recipe-detail.service";
import { NotFoundError } from "@/lib/services/errors";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: { recipe: { findUnique: jest.fn() } },
}));

const mockFindUnique = (prisma.recipe.findUnique as unknown) as jest.Mock;
const RECIPE = "123e4567-e89b-42d3-a456-426614174001";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Recipe Detail — store-set banner", () => {
  test("recipe ที่มี store post ผูกอยู่ → แสดง banner", async () => {
    mockFindUnique.mockResolvedValue({
      id: RECIPE,
      recipeName: "ต้มยำกุ้ง",
      storePosts: [
        {
          id: "sp1",
          storeName: "ร้านป้าแดง",
          sellingPrice: 120,
          storeDescription: null,
          storeLocation: null,
          contactInfo: null,
          visibility: "public",
        },
      ],
    });

    const result = await getRecipeDetail(RECIPE);

    expect(result.hasStoreBanner).toBe(true);
    expect(result.storeBanner).toMatchObject({
      storePostId: "sp1",
      storeName: "ร้านป้าแดง",
      sellingPrice: 120,
    });
  });

  test("recipe ที่ไม่มี store post → ไม่แสดง banner", async () => {
    mockFindUnique.mockResolvedValue({
      id: RECIPE,
      recipeName: "ต้มยำกุ้ง",
      storePosts: [],
    });

    const result = await getRecipeDetail(RECIPE);

    expect(result.hasStoreBanner).toBe(false);
    expect(result.storeBanner).toBeNull();
  });

  test("มีแต่ store post ที่ไม่ใช่ public (draft/private) → ไม่แสดง banner", async () => {
    // The service queries storePosts with { visibility: "public" },
    // so non-public posts never reach the detail view.
    mockFindUnique.mockResolvedValue({
      id: RECIPE,
      recipeName: "ต้มยำกุ้ง",
      storePosts: [],
    });

    const result = await getRecipeDetail(RECIPE);

    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          storePosts: expect.objectContaining({
            where: { visibility: "public" },
          }),
        }),
      }),
    );
    expect(result.hasStoreBanner).toBe(false);
  });

  test("recipe ที่ไม่มีอยู่จริง → NotFoundError", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(getRecipeDetail(RECIPE)).rejects.toBeInstanceOf(NotFoundError);
  });
});
