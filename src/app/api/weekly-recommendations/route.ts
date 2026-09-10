import { NextResponse } from "next/server";
import { ensureWeeklyRecommendations } from "@/lib/ai/weekly-recommendation";

export const dynamic = "force-dynamic";

/**
 * GET /api/weekly-recommendations
 * คืนสูตรอาหารแนะนำประจำสัปดาห์ (4 สูตร: ตามฤดูกาล 2 + ยอดนิยม 2)
 *
 * - ถ้ายังไม่เคยสร้างในสัปดาห์นี้ → เรียก AI (Gemini + Groq) สร้าง 4 สูตร บันทึกเป็น Recipe จริง
 *   + เก็บ index ลง weekly_recommendations แล้วคืนผล
 * - ถ้ามีแล้ว → คืนจากฐานข้อมูล (ไม่เรียก AI ซ้ำ)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const result = await ensureWeeklyRecommendations({ force });

    const recipes = result.recipes.map((entry) => ({
      id: entry.recipe.id,
      type: entry.type,
      recipeName: entry.recipe.recipeName,
      rating: entry.recipe.rating,
      favoriteCount: entry.recipe.favoriteCount,
      createdAt: entry.recipe.createdAt,
      bgColor: entry.recipe.bgColor,
      visibility: entry.recipe.visibility,
      imageUrl: entry.recipe.images?.[0]?.imageUrl ?? null,
    }));

    return NextResponse.json({
      success: true,
      weekKey: result.weekKey,
      generated: result.generated,
      missingProviders: result.missingProviders ?? [],
      recipes,
    });
  } catch (error) {
    console.error("GET /api/weekly-recommendations error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "ไม่สามารถสร้างสูตรอาหารแนะนำประจำสัปดาห์ได้ กรุณาลองใหม่อีกครั้ง",
      },
      { status: 500 }
    );
  }
}
