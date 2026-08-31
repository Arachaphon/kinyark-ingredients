import { NextResponse } from "next/server";
import { ensureIngredientPairRecipes } from "@/lib/ai/ingredient-pair-recipe";

export async function POST(req: Request) {
  try {
    const { ingredients } = await req.json();

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: "กรุณาระบุวัตถุดิบอย่างน้อย 1 ชนิด" },
        { status: 400 }
      );
    }

    const cleanIngredients = ingredients
      .map((i: unknown) => (typeof i === "string" ? i.trim() : String(i)))
      .filter(Boolean);

    const { recipes, generated, missingProviders } = await ensureIngredientPairRecipes(cleanIngredients);

    // รูปแบบ response สอดคล้องกับที่หน้า /search/results คาดหวัง (array ของรายการ)
    // รองรับหลาย AI (gemini + groq) → ส่งเป็นหลายรายการใน array
    const items = recipes.map((recipe) => ({
      id: recipe.id,
      recipeName: recipe.recipeName,
      description: recipe.description ?? "",
      instructions: recipe.instructions ?? "",
      aiProvider: recipe.aiProvider ?? "Gemini",
      isAi: true,
      rating: recipe.rating,
      reviewCount: recipe.reviewCount ?? 0,
      likes: 0,
      favoriteCount: 0,
      images: recipe.imageUrl ? [{ imageUrl: recipe.imageUrl }] : [],
      recipeIngredients: recipe.ingredients.map((ig) => ({
        ingredient: { name: ig.name },
        quantity: ig.quantity,
        unit: ig.unit,
      })),
      tags: cleanIngredients,
      generated,
    }));

    return NextResponse.json({
      items,
      missingAiProviders: missingProviders,
    });
  } catch (error) {
    console.error("AI Generate Error:", error);
    return NextResponse.json(
      { error: "Failed to generate recipes" },
      { status: 500 }
    );
  }
}
