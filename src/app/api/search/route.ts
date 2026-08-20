import { prisma } from "@/lib/prisma";
import { recipeListItemSelect } from "@/lib/recipes";
import { getAuthUserId } from "@/lib/auth-user";
import type { Prisma } from "@prisma/client";

// Build a bigram list (2-character sliding window) from a string.
// Works for Thai (no spaces between words) and Latin alike.
function bigrams(input: string): string[] {
  const chars = [...input.toLowerCase()].filter((c) => c.trim() !== "");
  const grams: string[] = [];
  for (let i = 0; i < chars.length - 1; i++) {
    grams.push(chars[i] + chars[i + 1]);
  }
  return grams;
}

// Count how many query bigrams appear in the candidate text (unique matches).
function overlapScore(queryGrams: string[], text: string): number {
  const querySet = new Set(queryGrams);
  const seen = new Set<string>();
  let score = 0;
  for (const g of bigrams(text)) {
    if (querySet.has(g) && !seen.has(g)) {
      seen.add(g);
      score++;
    }
  }
  return score;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || searchParams.get("query") || searchParams.get("ingredients") || "";

    if (!query.trim()) {
      return Response.json([]);
    }

    const cleanQuery = query.trim();

    const userId = await getAuthUserId(request);
    const userRole = request.headers.get("x-user-role");

    // Respect visibility so private/draft recipes are not exposed to others.
    const recipeVisibility: Prisma.RecipeWhereInput = userId
      ? {
          OR:
            userRole === "STORE"
              ? [{ visibility: "public" }, { userId }]
              : [{ visibility: { in: ["public", "protected"] } }, { userId }],
        }
      : { visibility: "public" };

    // Split by spaces or commas (for ?ingredients=หมู,กุ้ง)
    const keywords = cleanQuery.split(/[\s,]+/).filter(Boolean);

    const recipes = await prisma.recipe.findMany({
      where: {
        ...recipeVisibility,
        OR: [
          // Match full query string
          { recipeName: { contains: cleanQuery, mode: "insensitive" } },
          { description: { contains: cleanQuery, mode: "insensitive" } },
          { instructions: { contains: cleanQuery, mode: "insensitive" } },
          {
            recipeIngredients: {
              some: {
                ingredient: {
                  // Ingredient names must match exactly:
                  // searching "หมู" should hit "หมู" but not "หมูสับ".
                  name: { equals: cleanQuery },
                },
              },
            },
          },
          // Match individual keywords
          ...keywords.flatMap((kw) => [
            { recipeName: { contains: kw, mode: "insensitive" as const } },
            { description: { contains: kw, mode: "insensitive" as const } },
            { instructions: { contains: kw, mode: "insensitive" as const } },
            {
              recipeIngredients: {
                some: {
                  ingredient: {
                    name: { equals: kw },
                  },
                },
              },
            },
            {
              storePosts: {
                some: {
                  OR: [
                    { storeName: { contains: kw, mode: "insensitive" as const } },
                    { storeDescription: { contains: kw, mode: "insensitive" as const } },
                  ],
                },
              },
            },
          ]),
        ],
      },
      select: recipeListItemSelect({ withUser: true, withIngredients: true }),
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    let searchResults = recipes;

    // Thai has no word separators, so exact-phrase `contains` often misses
    // queries like "ข้าวผัดกระเพรา" vs a recipe named "ข้าวกะเพราหมูสับ".
    // When the strict query returns nothing, fall back to a bigram overlap match.
    if (searchResults.length === 0 && cleanQuery.length >= 2) {
      const queryGrams = bigrams(cleanQuery);

      const candidates = await prisma.recipe.findMany({
        where: recipeVisibility,
        select: { id: true, recipeName: true, description: true },
        take: 300,
      });

      const scored = candidates
        .map((recipe) => ({
          id: recipe.id,
          score:
            Math.max(
              overlapScore(queryGrams, recipe.recipeName),
              overlapScore(queryGrams, recipe.description ?? "")
            ),
        }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
        .map((entry) => entry.id);

      if (scored.length > 0) {
        const matched = await prisma.recipe.findMany({
          where: { id: { in: scored } },
          select: recipeListItemSelect({ withUser: true, withIngredients: true }),
        });
        const byId = new Map(matched.map((r) => [r.id, r]));
        searchResults = scored
          .map((id) => byId.get(id))
          .filter((r): r is NonNullable<typeof r> => Boolean(r));
      }
    }

    // Search orphaned Store Posts (not linked to a Recipe), respecting visibility.
    const storeVisibility = userId
      ? ({
          OR:
            userRole === "STORE"
              ? [{ visibility: "public" }, { userId }]
              : [{ visibility: { in: ["public", "protected"] } }, { userId }],
        } satisfies Prisma.StorePostWhereInput)
      : { visibility: "public" };

    const orphanedStorePosts = await prisma.storePost.findMany({
      where: {
        recipeId: null,
        ...storeVisibility,
        OR: [
          { storeName: { contains: cleanQuery, mode: "insensitive" } },
          { storeDescription: { contains: cleanQuery, mode: "insensitive" } },
          ...keywords.flatMap((kw) => [
            { storeName: { contains: kw, mode: "insensitive" as const } },
            { storeDescription: { contains: kw, mode: "insensitive" as const } },
          ]),
        ],
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        images: { orderBy: { createdAt: "asc" } },
        videos: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const dummyRecipesForOrphans = orphanedStorePosts.map((sp) => ({
      id: `orphan-${sp.id}`,
      recipeName: sp.storeName,
      description: sp.storeDescription,
      rating: 0,
      favoriteCount: 0,
      createdAt: sp.createdAt.toISOString(),
      bgColor: null,
      visibility: sp.visibility,
      images: sp.images,
      user: sp.user,
      recipeIngredients: [],
      storePosts: [{
        id: sp.id,
        userId: sp.userId,
        recipeId: "",
        storeName: sp.storeName,
        sellingPrice: sp.sellingPrice,
        storeDescription: sp.storeDescription,
        storeLocation: sp.storeLocation,
        contactInfo: sp.contactInfo,
        setIngredients: sp.setIngredients as unknown as Array<{ name: string; quantity: string | number; unit: string; }>,
        visibility: sp.visibility,
        createdAt: sp.createdAt.toISOString(),
        user: sp.user,
        images: sp.images,
        videos: sp.videos,
      }],
    }));

    return Response.json([...searchResults, ...dummyRecipesForOrphans]);
  } catch (error) {
    console.error("GET /api/search error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}