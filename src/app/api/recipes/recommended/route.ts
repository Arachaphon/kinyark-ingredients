// src/app/api/posts/recommended/route.ts
import { NextResponse } from "next/server";

// ✅ อ้างอิงพุ่งตรงเข้าหา @/lib/prisma ที่เจอตัวจริงได้เลยครับ!
import { prisma } from "@/lib/prisma"; 

export async function GET() {
  try {
    // 🔍 วิ่งไปควักข้อมูลจากตาราง posts ใน Supabase
    const allRecipes = await prisma.recipe.findMany({
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