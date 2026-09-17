/**
 * AI Weekly Recommendation Module (SRS: ระบบแนะนำประจำสัปดาห์)
 * Covers: fallback to cached/mock data when AI providers fail (never throws
 * to the UI), and the "AI Recipe" badge on AI-sourced results only.
 *
 * Implementation: src/lib/services/ai-recommendation.service.ts.
 * AI providers are injected fakes — no network calls.
 */

import {
  AI_RECIPE_BADGE,
  FALLBACK_WEEKLY_RECIPES,
  attachAiBadge,
  getWeeklyRecommendationsWithFallback,
} from "@/lib/services/ai-recommendation.service";

describe("AI Weekly Recommendation — fallback", () => {
  test("AI ล้มเหลว → คืนข้อมูล cached แทนการ throw error", async () => {
    const cached = [{ id: "c1", recipeName: "เมนูแคช", isAi: false }];
    const result = await getWeeklyRecommendationsWithFallback({
      fetchFresh: () => Promise.reject(new Error("gemini 500")),
      getCached: () => Promise.resolve(cached),
    });

    expect(result.fallback).toBe(true);
    expect(result.recipes).toEqual(cached);
    expect(result.missingProviders).toContain("gemini");
  });

  test("AI ล้มเหลว + ไม่มี cache → คืน mock data (ไม่ throw)", async () => {
    const result = await getWeeklyRecommendationsWithFallback({
      fetchFresh: () => Promise.reject(new Error("all providers down")),
      getCached: () => Promise.resolve([]),
    });

    expect(result.fallback).toBe(true);
    expect(result.recipes).toEqual(FALLBACK_WEEKLY_RECIPES);
    expect(result.recipes.length).toBeGreaterThan(0);
  });

  test("AI สำเร็จ → คืนผลสดพร้อม fallback: false", async () => {
    const fresh = {
      weekKey: "2026-W38",
      recipes: [{ id: "g1", recipeName: "ต้มยำ AI", isAi: true as const }],
      generated: true,
      missingProviders: [] as string[],
    };
    const result = await getWeeklyRecommendationsWithFallback({
      fetchFresh: () => Promise.resolve(fresh),
      getCached: () => Promise.resolve([]),
    });

    expect(result.fallback).toBe(false);
    expect(result.recipes).toEqual(fresh.recipes);
  });
});

describe("AI Weekly Recommendation — AI Recipe badge", () => {
  test('badge "AI Recipe" ติดเฉพาะผลลัพธ์ที่มาจาก AI', () => {
    const items = [
      { id: "g1", recipeName: "เมนู AI", isAi: true },
      { id: "h1", recipeName: "เมนูคน", isAi: false },
    ];
    const [ai, human] = attachAiBadge(items);

    expect(ai.badge).toBe(AI_RECIPE_BADGE);
    expect(ai.isAi).toBe(true);
    expect(human.badge).toBeUndefined();
    expect(human.isAi).toBe(false);
  });

  test("ผลที่มี aiProvider รู้จัก (groq) ถือเป็น AI — ผลไม่มี provider ไม่มี badge", () => {
    const items = [
      { id: "g1", recipeName: "เมนู groq", aiProvider: "groq" },
      { id: "h1", recipeName: "เมนูคน", aiProvider: null },
    ];
    const [ai, human] = attachAiBadge(items);

    expect(ai.badge).toBe(AI_RECIPE_BADGE);
    expect(human.badge).toBeUndefined();
  });
});
