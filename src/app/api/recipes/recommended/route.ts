// src/app/api/posts/recommended/route.ts
import { NextResponse } from "next/server";

// ✅ อ้างอิงพุ่งตรงเข้าหา @/lib/prisma ที่เจอตัวจริงได้เลยครับ!
import { prisma } from "@/lib/prisma"; 
import { createClient } from "@/lib/supabase/server";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    // Check user role for visibility filtering
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let whereCondition: Prisma.RecipeWhereInput;

    if (user) {
      const profile = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });
      if (profile?.role === "STORE") {
        whereCondition = {
          OR: [
            { visibility: "public" },
            { userId: user.id },
          ],
        };
      } else {
        whereCondition = {
          OR: [
            { visibility: { in: ["public", "protected"] } },
            { userId: user.id },
          ],
        };
      }
    } else {
      whereCondition = { visibility: { in: ["public", "protected"] } };
    }

    // 🔍 วิ่งไปควักข้อมูลจากตาราง posts ใน Supabase
    const allRecipes = await prisma.recipe.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" }
    });

    // ✂️ คัดแยกกลุ่มตาม AI Provider (ตัวพิมพ์เล็ก)
    const gemini = allRecipes.filter(r => r.aiProvider?.toLowerCase() === "gemini");
    const deepseek = allRecipes.filter(r => r.aiProvider?.toLowerCase() === "deepseek");

    return NextResponse.json({ gemini, deepseek });
  } catch (error) {
    console.error("Error fetching recommended recipes:", error);
    return NextResponse.json({ error: "หลังบ้านดึงข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}