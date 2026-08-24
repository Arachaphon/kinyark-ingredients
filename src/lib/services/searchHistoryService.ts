import { prisma } from "@/lib/prisma";
import { REC_CACHE_PREFIX, FEATURED_SEARCH_MARKER } from "@/lib/cache";

export async function saveSearchHistory(userId: string, searchQuery: string) {
  const trimmedQuery = searchQuery.trim();
  if (!trimmedQuery) return null;

  const normalizedQuery = trimmedQuery.toLowerCase();

  // Find existing entries for this user to check case-insensitive match
  const userHistories = await prisma.searchHistory.findMany({
    where: { userId },
    select: { id: true, searchQuery: true },
  });

  const duplicateIds = userHistories
    .filter((h) => h.searchQuery.trim().toLowerCase() === normalizedQuery)
    .map((h) => h.id);

  // Transaction: Delete existing duplicates and create new history record
  const createdRecord = await prisma.$transaction(async (tx) => {
    if (duplicateIds.length > 0) {
      await tx.searchHistory.deleteMany({
        where: { id: { in: duplicateIds } },
      });
    }

    return await tx.searchHistory.create({
      data: {
        userId,
        searchQuery: trimmedQuery,
      },
    });
  });

  // Non-blocking cleanup: expire entries older than 1 month and keep only
  // the latest 20 records per user (internal markers excluded from the cap).
  (async () => {
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      await prisma.searchHistory.deleteMany({
        where: { userId, createdAt: { lt: oneMonthAgo } },
      });

      const allHistories = await prisma.searchHistory.findMany({
        where: {
          userId,
          NOT: {
            OR: [
              { searchQuery: FEATURED_SEARCH_MARKER },
              { searchQuery: { startsWith: REC_CACHE_PREFIX } },
            ],
          },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      if (allHistories.length > 20) {
        const idsToDelete = allHistories.slice(20).map((h) => h.id);
        await prisma.searchHistory.deleteMany({
          where: { id: { in: idsToDelete } },
        });
      }
    } catch (err) {
      console.error("Error in search history cleanup:", err);
    }
  })();

  // New search signal → drop the sticky recommendation so it re-picks immediately.
  (async () => {
    try {
      await prisma.searchHistory.deleteMany({
        where: { userId, searchQuery: { startsWith: REC_CACHE_PREFIX } },
      });
    } catch (err) {
      console.error("Error invalidating recommendation cache:", err);
    }
  })();

  return createdRecord;
}

export async function getSearchHistory(userId: string, limit: number = 20) {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  // Never return entries older than 1 month; hide internal marker rows.
  return await prisma.searchHistory.findMany({
    where: {
      userId,
      createdAt: { gte: oneMonthAgo },
      NOT: {
        OR: [
          { searchQuery: FEATURED_SEARCH_MARKER },
          { searchQuery: { startsWith: REC_CACHE_PREFIX } },
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function deleteSearchHistoryById(userId: string, historyId: string): Promise<boolean> {
  const result = await prisma.searchHistory.deleteMany({
    where: {
      id: historyId,
      userId,
    },
  });
  return result.count > 0;
}

export async function clearAllSearchHistory(userId: string) {
  return await prisma.searchHistory.deleteMany({
    where: { userId },
  });
}
