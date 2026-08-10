// src/lib/ai/recommendation.ts
import { prisma } from '@/lib/prisma';

export interface UserContext {
  favorites: string[];
  searchHistory: string[];
  ratings: Array<{
    recipeName: string;
    rating: number;
  }>;
}

/**
 * ดึงข้อมูล Favorite, Search History และ Rating ของผู้ใช้
 * สำหรับนำไปใช้เป็น Context ในระบบ Recommendation
 */
export async function getUserContext(userId: string): Promise<UserContext> {
  const [favorites, searchHistories, reviews] = await Promise.all([
    // 1. ดึงข้อมูล Favorite
    prisma.favorite.findMany({
      where: { userId },
      take: 10,
      include: {
        recipe: {
          select: { recipeName: true }, // ใช้ recipeName ตาม schema
        },
      },
      orderBy: { createdAt: 'desc' },
    }),

    // 2. ดึงข้อมูล Search History (ใช้ searchHistory ตาม schema)
    prisma.searchHistory.findMany({
      where: { userId },
      take: 10,
      select: { searchQuery: true }, // ใช้ searchQuery ตาม schema
      orderBy: { createdAt: 'desc' },
    }),

    // 3. ดึงข้อมูล Rating / Review
    prisma.review.findMany({
      where: { userId },
      take: 10,
      include: {
        recipe: {
          select: { recipeName: true }, // ใช้ recipeName ตาม schema
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    favorites: favorites.map((item) => item.recipe.recipeName),
    searchHistory: searchHistories.map((item) => item.searchQuery),
    ratings: reviews.map((item) => ({
      recipeName: item.recipe.recipeName,
      rating: item.rating,
    })),
  };
}