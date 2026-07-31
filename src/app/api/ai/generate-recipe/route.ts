import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { ingredients } = await req.json();

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: "กรุณาระบุวัตถุดิบอย่างน้อย 1 ชนิด" },
        { status: 400 }
      );
    }

    const ingredientsStr = ingredients.join(", ");

    const generatedRecipes = [
      {
        id: `ai-gemini-${Date.now()}-1`,
        recipeName: `เมนูสร้างสรรค์จาก ${ingredientsStr}`,
        aiProvider: "Gemini",
        isAi: true,
        rating: 4.8,
        likes: 65,
        tags: ingredients,
      },
      {
        id: `ai-deepseek-${Date.now()}-2`,
        recipeName: `ผัดกลมกล่อม ${ingredientsStr}`,
        aiProvider: "Deep Seek",
        isAi: true,
        rating: 4.5,
        likes: 52,
        tags: ingredients,
      },
    ];

    return NextResponse.json(generatedRecipes);
  } catch (error) {
    console.error("AI Generate Error:", error);
    return NextResponse.json(
      { error: "Failed to generate recipes" },
      { status: 500 }
    );
  }
}