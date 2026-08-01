import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { recipeListItemSelect } from "@/lib/recipes"
import { z } from "zod"

export const dynamic = "force-dynamic";

const FEATURED_MARKER = "__featured__";
const DEFAULT_LIMIT = 6;

const featuredQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(DEFAULT_LIMIT),
});

type FeaturedRecipe = {
  id: string;
  recipeName: string;
  rating: number;
  favoriteCount: number;
  createdAt: Date;
  bgColor: string | null;
  images: { id: string; imageUrl: string }[];
};

// Deterministic seeded PRNG (mulberry32)
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  const rng = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Same seed all day (UTC), different next day → daily rotation
function daySeed(): number {
  return Math.floor(Date.now() / 86_400_000);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = featuredQuerySchema.safeParse({
      limit: searchParams.get("limit") ?? undefined,
    })

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const limit = parsed.data.limit

    const recipes = await prisma.recipe.findMany({
      where: { visibility: "public" },
      select: recipeListItemSelect(),
      orderBy: [{ rating: "desc" }, { favoriteCount: "desc" }, { createdAt: "desc" }],
    })

    const shuffled: FeaturedRecipe[] = seededShuffle(recipes, daySeed())

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || shuffled.length === 0) {
      return Response.json({
        data: shuffled.slice(0, limit),
        total: shuffled.length,
        cursor: 0,
      })
    }

    // Track iteration through today's list via SearchHistory as cursor
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const record = await prisma.searchHistory.findFirst({
      where: {
        userId: user.id,
        searchQuery: FEATURED_MARKER,
        createdAt: { gte: startOfToday },
      },
      orderBy: { createdAt: "desc" },
    })

    const start = (record?.featuredCursor ?? 0) % shuffled.length
    const page: FeaturedRecipe[] = []
    for (let i = 0; i < limit; i++) {
      page.push(shuffled[(start + i) % shuffled.length])
    }
    const nextCursor = (start + limit) % shuffled.length

    if (record) {
      await prisma.searchHistory.update({
        where: { id: record.id },
        data: { featuredCursor: nextCursor },
      })
    } else {
      await prisma.searchHistory.create({
        data: {
          userId: user.id,
          searchQuery: FEATURED_MARKER,
          featuredCursor: nextCursor,
        },
      })
    }

    return Response.json({ data: page, total: shuffled.length, cursor: nextCursor })
  } catch (error) {
    console.error("Error fetching featured recipes:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
