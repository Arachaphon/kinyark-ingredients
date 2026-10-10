import { getAiAuthor } from "@/lib/ai-author";

/** Badge shown on recipe cards for AI-generated results only. */
export const AI_RECIPE_BADGE = "AI Recipe" as const;

export interface RecommendationItem {
  id: string;
  recipeName: string;
  isAi?: boolean;
  aiProvider?: string | null;
}

export type BadgedItem<T> = T & { isAi: boolean; badge?: typeof AI_RECIPE_BADGE };

/**
 * Attach the "AI Recipe" badge — and ONLY to AI-sourced results.
 * An item counts as AI-sourced when it is explicitly flagged `isAi`
 * or carries a recognised `aiProvider` (gemini/groq/deepseek).
 * Human recipes always come back with `isAi: false` and no badge.
 */
export function attachAiBadge<T extends RecommendationItem>(
  items: T[],
): BadgedItem<T>[] {
  return items.map((item) => {
    const ai =
      item.isAi === true || getAiAuthor(item.aiProvider ?? null) !== null;
    return ai
      ? { ...item, isAi: true, badge: AI_RECIPE_BADGE }
      : { ...item, isAi: false };
  });
}

export interface WeeklyRecommendationResult {
  weekKey: string;
  recipes: RecommendationItem[];
  generated: boolean;
  missingProviders: string[];
}

/** Last-resort content when AI fails AND no cached week exists. Never throws. */
export const FALLBACK_WEEKLY_RECIPES: RecommendationItem[] = [
  { id: "fallback-seasonal", recipeName: "เมนูแนะนำประจำสัปดาห์", isAi: false },
  { id: "fallback-trending", recipeName: "เมนูยอดนิยมประจำสัปดาห์", isAi: false },
];

/**
 * Weekly recommendations with graceful degradation (SRS: AI Weekly
 * Recommendation Module). The fresh fetcher (Gemini/Groq via
 * ensureWeeklyRecommendations) is injected so tests never hit the network.
 *
 * - Fresh fetch succeeds → return it, fallback: false.
 * - Fresh fetch throws → return cached week instead (fallback: true).
 * - Cache empty too → return built-in mock items (fallback: true).
 * This function itself never throws — the UI always has something to render.
 */
export async function getWeeklyRecommendationsWithFallback(options: {
  fetchFresh: () => Promise<WeeklyRecommendationResult>;
  getCached: () => Promise<RecommendationItem[]>;
}): Promise<WeeklyRecommendationResult & { fallback: boolean }> {
  try {
    const fresh = await options.fetchFresh();
    return { ...fresh, fallback: false };
  } catch {
    const cached = await options.getCached();
    const recipes = cached.length > 0 ? cached : FALLBACK_WEEKLY_RECIPES;
    return {
      weekKey: "cached",
      recipes,
      generated: false,
      missingProviders: ["gemini", "groq"],
      fallback: true,
    };
  }
}
