/**
 * Store Set / Marketplace Module (SRS: ระบบร้านค้า)
 * Covers: price validation, setIngredients↔recipe linking,
 * sold-out visibility transition (public → private), invalid recipeId rejection.
 *
 * Implementation: src/lib/services/store-set.service.ts (mocked Prisma).
 */

import {
  createStorePost,
  markStorePostSoldOut,
} from "@/lib/services/store-set.service";
import {
  NotFoundError,
  ServiceValidationError,
} from "@/lib/services/errors";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    recipe: { findUnique: jest.fn() },
    storePost: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

type MockDb = Record<string, Record<string, jest.Mock>>;
const mockDb = prisma as unknown as MockDb;

const USER = "123e4567-e89b-42d3-a456-426614174002";
const RECIPE = "123e4567-e89b-42d3-a456-426614174001";

const baseInput = { storeName: "ร้านป้าแดง", sellingPrice: 120 };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Store Set Module — validation", () => {
  test("ราคาติดลบต้อง reject (sellingPrice < 0)", async () => {
    await expect(
      createStorePost(USER, { ...baseInput, sellingPrice: -5 }),
    ).rejects.toBeInstanceOf(ServiceValidationError);
    expect(mockDb.storePost.create).not.toHaveBeenCalled();
  });

  test("ไม่กรอกราคาต้อง reject (sellingPrice ว่าง)", async () => {
    const { sellingPrice: _omitted, ...noPrice } = baseInput;
    void _omitted;
    await expect(createStorePost(USER, noPrice)).rejects.toBeInstanceOf(
      ServiceValidationError,
    );
    expect(mockDb.storePost.create).not.toHaveBeenCalled();
  });
});

describe("Store Set Module — linking & lifecycle", () => {
  test("ผูก setIngredients กับ recipeId ที่มีอยู่จริง", async () => {
    mockDb.recipe.findUnique.mockResolvedValue({ id: RECIPE });
    const created = { id: "sp1", recipeId: RECIPE };
    mockDb.storePost.create.mockResolvedValue(created);

    const input = {
      ...baseInput,
      recipeId: RECIPE,
      setIngredients: [{ name: "ไก่", quantity: 500, unit: "g" }],
    };
    await expect(createStorePost(USER, input)).resolves.toEqual(created);
    expect(mockDb.storePost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: USER,
          recipeId: RECIPE,
          setIngredients: input.setIngredients,
        }),
      }),
    );
  });

  test("สินค้าหมด: visibility เปลี่ยน public → private", async () => {
    mockDb.storePost.findUnique.mockResolvedValue({
      userId: USER,
      visibility: "public",
    });
    mockDb.storePost.update.mockResolvedValue({ visibility: "private" });

    const result = await markStorePostSoldOut("sp1", USER);

    expect(mockDb.storePost.update).toHaveBeenCalledWith({
      where: { id: "sp1" },
      data: { visibility: "private" },
    });
    expect(result).toEqual({ visibility: "private" });
  });

  test("โพสต์ที่ไม่ใช่ public (เช่น draft) ต้องคงสถานะเดิม", async () => {
    mockDb.storePost.findUnique.mockResolvedValue({
      userId: USER,
      visibility: "draft",
    });

    const result = await markStorePostSoldOut("sp1", USER);

    expect(mockDb.storePost.update).not.toHaveBeenCalled();
    expect(result).toEqual({ userId: USER, visibility: "draft" });
  });

  test("สร้าง store post ด้วย recipeId ที่ไม่มีอยู่จริงต้อง reject", async () => {
    mockDb.recipe.findUnique.mockResolvedValue(null);

    await expect(
      createStorePost(USER, { ...baseInput, recipeId: RECIPE }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(mockDb.storePost.create).not.toHaveBeenCalled();
  });
});
