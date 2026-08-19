import { prisma } from "@/lib/prisma"
import { recipeListItemSelect } from "@/lib/recipes"
import type { Prisma } from "@prisma/client"
import { cache, TTL_FEATURED } from "@/lib/cache"
import { getAuthUserId } from "@/lib/auth-user"

export const dynamic = "force-dynamic";

const FEATURED_MARKER = "__featured__";
const REC_CACHE_PREFIX = "__rec_cache__:";
const REC_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // recompute every 3 days

// 3-day rolling window key (epoch-aligned): the recommendation stays fixed for
// at least 3 days and is only recomputed when the window rolls over.
function recWindowKey(): string {
  const now = Date.now();
  return new Date(now - (now % REC_WINDOW_MS)).toISOString();
}

// Pick a single recipe from the user's search history (ingredient + name),
// favorites, and rating. Returns the recipe id or null.
async function pickRecommended(
  user: { id: string; role: string | null },
  visibility: Prisma.RecipeWhereInput
): Promise<string | null> {
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

  // Signal 1: search history (last month, ignoring internal markers)
  const histories = await prisma.searchHistory.findMany({
    where: {
      userId: user.id,
      createdAt: { gte: oneMonthAgo },
      NOT: {
        OR: [
          { searchQuery: FEATURED_MARKER },
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

  // Map search queries to matched ingredients (semantic, contains-based).
  let ingredientIds: number[] = [];
  if (searchQueries.length > 0) {
    const matchedIngredients = await prisma.ingredient.findMany({
      where: {
        OR: searchQueries.map((q) => ({
          name: { contains: q, mode: "insensitive" as const },
        })),
      },
      select: { id: true },
      take: 20,
    });
    ingredientIds = matchedIngredients.map((i) => i.id);
  }

  // Signal 2: user favorites
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    select: { recipeId: true },
  });
  const favoriteIds = new Set(favorites.map((f) => f.recipeId));

  // Candidate pool: recipes containing a searched ingredient, recipes whose
  // name matches a query, and favorites.
  const candidateFilters: Prisma.RecipeWhereInput[] = [];
  if (ingredientIds.length > 0) {
    candidateFilters.push({
      recipeIngredients: { some: { ingredientId: { in: ingredientIds } } },
    });
  }
  if (searchQueries.length > 0) {
    candidateFilters.push(
      ...searchQueries.map((q) => ({
        recipeName: { contains: q, mode: "insensitive" as const },
      }))
    );
  }
  if (favoriteIds.size > 0) {
    candidateFilters.push({ id: { in: [...favoriteIds] } });
  }

  const candidates = await prisma.recipe.findMany({
    where: {
      ...visibility,
      OR: candidateFilters,
    },
    select: {
      id: true,
      recipeName: true,
      rating: true,
      favoriteCount: true,
      reviewCount: true,
      recipeIngredients: { select: { ingredientId: true } },
    },
    take: 50,
  });

  if (candidates.length === 0) {
    // No signals yet: fall back to the most liked/rated recipe.
    const fallback = await prisma.recipe.findMany({
      where: visibility,
      orderBy: [{ favoriteCount: "desc" }, { rating: "desc" }],
      select: { id: true },
      take: 1,
    });
    return fallback[0]?.id ?? null;
  }

  const ingredientSet = new Set(ingredientIds);
  let best: { id: string; score: number } | null = null;

  for (const r of candidates) {
    const nameLower = (r.recipeName ?? "").toLowerCase();
    let score = 0;

    // Signal 1: search history hits (+20 per matched ingredient, +15 per name hit)
    const matchedIngredients = r.recipeIngredients.filter((ri) =>
      ingredientSet.has(ri.ingredientId)
    ).length;
    score += matchedIngredients * 20;
    if (searchQueries.some((q) => nameLower.includes(q))) score += 15;

    // Signal 2: user favorited this recipe
    if (favoriteIds.has(r.id)) score += 30;

    // Signal 3: rating (max 5 → +50) + popularity tie-break
    score += (r.rating ?? 0) * 10;
    score += Math.min(r.favoriteCount ?? 0, 50) * 0.5;
    score += Math.min(r.reviewCount ?? 0, 50) * 0.5;

    if (best === null || score > best.score) {
      best = { id: r.id, score };
    }
  }

  return best?.id ?? null;
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
        orderBy: [{ favoriteCount: "desc" }, { rating: "desc" }],
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