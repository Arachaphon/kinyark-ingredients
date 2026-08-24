import { prisma } from "@/lib/prisma"
import { recipeListItemSelect } from "@/lib/recipes"
import type { Prisma } from "@prisma/client"
import { cache, TTL_FEATURED, REC_CACHE_PREFIX, FEATURED_SEARCH_MARKER } from "@/lib/cache"
import { getAuthUserId } from "@/lib/auth-user"

export const dynamic = "force-dynamic";

const REC_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // recompute every 3 days

// 3-day rolling window key (epoch-aligned): the recommendation stays fixed for
// at least 3 days and is only recomputed when the window rolls over.
function recWindowKey(): string {
  const now = Date.now();
  return new Date(now - (now % REC_WINDOW_MS)).toISOString();
}

// Pick a single recipe using strict priority tiers:
//   1. Name matches the user's recent searches
//   2. Shares ingredients with recipes the user favorited
//   3/4. Global fallback: highest rating, then most favorited
// Already-favorited recipes and the user's own recipes are never recommended.
async function pickRecommended(
  user: { id: string; role: string | null },
  visibility: Prisma.RecipeWhereInput
): Promise<string | null> {
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

  // Priority signal #1 input: recent search queries (ignoring internal markers)
  const histories = await prisma.searchHistory.findMany({
    where: {
      userId: user.id,
      createdAt: { gte: oneMonthAgo },
      NOT: {
        OR: [
          { searchQuery: FEATURED_SEARCH_MARKER },
          { searchQuery: { startsWith: REC_CACHE_PREFIX } },
        ],
      },
    },
    select: { searchQuery: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const searchQueries = Array.from(
    new Set(
      histories
        .map((h) => h.searchQuery.trim().toLowerCase())
        .filter((q) => q.length > 1)
    )
  );

  // Priority signal #2 input: the user's favorites
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    select: { recipeId: true },
  });
  const favoriteIds = [...new Set(favorites.map((f) => f.recipeId))];

  // Within every tier: rating first (priority 3), then favoriteCount (priority 4).
  const rankOrderBy: Prisma.RecipeOrderByWithRelationInput[] = [
    { rating: "desc" },
    { favoriteCount: "desc" },
  ];

  // Never recommend something the user already favorited or created.
  const exclusions: Prisma.RecipeWhereInput = {
    ...(favoriteIds.length > 0 ? { id: { notIn: favoriteIds } } : {}),
    userId: { not: user.id },
  };

  if (searchQueries.length > 0) {
    const tier1 = await prisma.recipe.findMany({
      where: {
        ...visibility,
        ...exclusions,
        OR: searchQueries.map((q) => ({
          recipeName: { contains: q, mode: "insensitive" as const },
        })),
      },
      orderBy: rankOrderBy,
      select: { id: true },
      take: 1,
    });
    if (tier1[0]) return tier1[0].id;
  }

  if (favoriteIds.length > 0) {
    const favIngredients = await prisma.recipeIngredient.findMany({
      where: { recipeId: { in: favoriteIds } },
      select: { ingredientId: true },
    });
    const ingredientIds = [...new Set(favIngredients.map((ri) => ri.ingredientId))];

    if (ingredientIds.length > 0) {
      const tier2 = await prisma.recipe.findMany({
        where: {
          ...visibility,
          ...exclusions,
          recipeIngredients: { some: { ingredientId: { in: ingredientIds } } },
        },
        orderBy: rankOrderBy,
        select: { id: true },
        take: 1,
      });
      if (tier2[0]) return tier2[0].id;
    }
  }

  // No personal signals yet: fall back to best rated / most liked.
  const fallback = await prisma.recipe.findMany({
    where: visibility,
    orderBy: rankOrderBy,
    select: { id: true },
    take: 1,
  });
  return fallback[0]?.id ?? null;
}

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    const userRole = request.headers.get("x-user-role");
    const user = userId ? { id: userId, role: userRole } : null;

    // Anonymous: top public recipe (freshness via in-memory cache)
    if (!user) {
      const anonKey = "featured:anon";
      if (process.env.NODE_ENV !== "test") {
        const cached = cache.get(anonKey);
        if (cached) {
          return Response.json({ data: cached, total: (cached as unknown[]).length, cursor: 0 });
        }
      }
      const anonymous = await prisma.recipe.findMany({
        relationLoadStrategy: "join",
        where: { visibility: "public" },
        select: recipeListItemSelect(),
        orderBy: [{ rating: "desc" }, { favoriteCount: "desc" }],
        take: 1,
      });
      cache.set(anonKey, anonymous, TTL_FEATURED);
      return Response.json({ data: anonymous, total: anonymous.length, cursor: 0 });
    }

    let visibility: Prisma.RecipeWhereInput;
    if (userRole === "STORE") {
      visibility = { OR: [{ visibility: "public" }, { userId: user.id }] };
    } else {
      visibility = { OR: [{ visibility: { in: ["public", "protected"] } }, { userId: user.id }] };
    }

    const windowKey = recWindowKey();

    // Look for a cached recommendation for the current 3-day window.
    const cacheRecord = await prisma.searchHistory.findFirst({
      where: {
        userId: user.id,
        searchQuery: { startsWith: REC_CACHE_PREFIX },
      },
      orderBy: { createdAt: "desc" },
    });

    let targetId: string | null = null;
    if (cacheRecord) {
      try {
        const cached = JSON.parse(cacheRecord.searchQuery.replace(REC_CACHE_PREFIX, ""));
        if (cached.window === windowKey && typeof cached.id === "string") {
          targetId = cached.id;
        }
      } catch {
        // corrupt record → recompute below
      }
    }

    if (!targetId) {
      targetId = await pickRecommended(user, visibility);

      const cacheVal = `${REC_CACHE_PREFIX}${JSON.stringify({ window: windowKey, id: targetId })}`;
      if (cacheRecord) {
        await prisma.searchHistory.update({
          where: { id: cacheRecord.id },
          data: { searchQuery: cacheVal, createdAt: new Date() },
        });
      } else {
        await prisma.searchHistory.create({
          data: { userId: user.id, searchQuery: cacheVal },
        });
      }
    }

    if (!targetId) {
      return Response.json({ data: [], total: 0, cursor: 0 });
    }

    // Load full details for the single recommended recipe.
    const featured = await prisma.recipe.findMany({
      relationLoadStrategy: "join",
      where: { id: targetId },
      select: recipeListItemSelect(),
    });

    return Response.json({ data: featured, total: featured.length, cursor: 0 });
  } catch (error) {
    console.error("Error fetching featured recipes:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}