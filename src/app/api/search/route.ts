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
    const query = searchParams.get("q") || searchParams.get("query") || "";
    const ingredientsParam = searchParams.get("ingredients");

    const userId = await getAuthUserId(request);
    const userRole = request.headers.get("x-user-role");

    let actualRole = userRole;
    if (userId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (dbUser?.role) {
        actualRole = dbUser.role;
      }
    }

    const isStore = actualRole === "STORE";

    // Respect visibility so private/draft recipes are not exposed incorrectly.
    // - draft: forbidden for everyone in search (even owner)
    // - STORE role: public, or private (if owned by store). protected is strictly forbidden.
    // - Non-STORE role: public or protected, or private (if owned by user).
    const recipeVisibility: Prisma.RecipeWhereInput = {
      AND: [
        { visibility: { not: "draft" } },
        {
          OR: isStore
            ? [
                { visibility: "public" },
                ...(userId ? [{ userId, visibility: "private" as const }] : []),
              ]
            : [
                { visibility: { in: ["public", "protected"] } },
                ...(userId ? [{ userId, visibility: "private" as const }] : []),
              ],
        },
      ],
    };

    // Strict ingredient search (?ingredients=วุ้นเส้น,หมู): every selected
    // ingredient must be present in the recipe (extra recipe ingredients OK).
    if (ingredientsParam !== null) {
      const requiredIngredients = ingredientsParam
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);

      if (requiredIngredients.length === 0) {
        return Response.json([]);
      }

      const recipes = await prisma.recipe.findMany({
        where: {
          AND: [
            ...(Array.isArray(recipeVisibility.AND) ? recipeVisibility.AND : [recipeVisibility]),
            ...requiredIngredients.map((name) => ({
              recipeIngredients: {
                some: {
                  ingredient: { name: { equals: name } },
                },
              },
            })),
          ],
        },
        select: recipeListItemSelect({ withUser: true, withIngredients: true }),
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return Response.json(recipes);
    }

    if (!query.trim()) {
      return Response.json([]);
    }

    const cleanQuery = query.trim();

    // Split by spaces or commas
    const keywords = cleanQuery.split(/[\s,]+/).filter(Boolean);

    const recipes = await prisma.recipe.findMany({
      where: {
        ...recipeVisibility,
        OR: [
          // Match full query string: recipe name only (contains), plus
          // ingredient names that match exactly (searching "หมู" should hit
          // "หมู" but not "หมูสับ"). description/instructions are excluded.
          { recipeName: { contains: cleanQuery, mode: "insensitive" } },
          {
            recipeIngredients: {
              some: {
                ingredient: {
                  name: { equals: cleanQuery },
                },
              },
            },
          },
          // Match individual keywords
          ...keywords.flatMap((kw) => [
            { recipeName: { contains: kw, mode: "insensitive" as const } },
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
                  storeName: { contains: kw, mode: "insensitive" as const },
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
    // When the strict query returns nothing, fall back to a bigram overlap
    // match on the recipe name only.
    if (searchResults.length === 0 && cleanQuery.length >= 2) {
      const queryGrams = bigrams(cleanQuery);

      const candidates = await prisma.recipe.findMany({
        where: recipeVisibility,
        select: { id: true, recipeName: true },
        take: 300,
      });

      const scored = candidates
        .map((recipe) => ({
          id: recipe.id,
          score: overlapScore(queryGrams, recipe.recipeName),
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
    const storeVisibility: Prisma.StorePostWhereInput = {
      AND: [
        { visibility: { not: "draft" } },
        {
          OR: isStore
            ? [
                { visibility: "public" },
                ...(userId ? [{ userId, visibility: "private" as const }] : []),
              ]
            : [
                { visibility: { in: ["public", "protected"] } },
                ...(userId ? [{ userId, visibility: "private" as const }] : []),
              ],
        },
      ],
    };

    // setIngredients is a JSON array of `{ name, amount }`. Prisma cannot do an
    // exact name match inside the JSON array, so we pull a candidate pool and
    // filter in JS by storeName (contains) OR exact ingredient name.
    const matchesStorePost = (sp: {
      setIngredients: unknown;
      storeName: string;
    }) => {
      const items = Array.isArray(sp.setIngredients)
        ? (sp.setIngredients as Array<{ name?: string }>)
        : [];
      return (term: string) =>
        sp.storeName.toLowerCase().includes(term.toLowerCase()) ||
        items.some((item) => item.name === term);
    };

    const orphanStorePosts = await prisma.storePost.findMany({
      where: {
        recipeId: null,
        ...storeVisibility,
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        images: { orderBy: { createdAt: "asc" } },
        videos: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const orphanedStorePosts = orphanStorePosts
      .filter((sp) => {
        const matches = matchesStorePost(sp);
        return matches(cleanQuery) || keywords.some((kw) => matches(kw));
      })
      .slice(0, 50);

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