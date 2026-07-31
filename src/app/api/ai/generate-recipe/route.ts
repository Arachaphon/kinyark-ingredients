import { NextResponse } from "next/server";
import { generateRecipeFromIngredients } from "@/lib/ai/generate-recipe";
import { generateMenuRequestSchema } from "@/lib/validations/ai.schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = generateMenuRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลที่ส่งมาไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await generateRecipeFromIngredients(parsed.data);
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างเมนูอาหาร" },
      { status: 500 }
    );
  }
}