import { NextResponse } from "next/server";
import { callGemini } from "@/lib/ai/gemini-client";
import OpenAI from "openai"; // 👈 ใช้ไลบรารีของ OpenAI ได้เลย

export async function POST(request: Request) {
  try {
    const { prompt, provider } = await request.json();

    // ==========================================
    // 🤖 ค่าย Google (Gemini)
    // ==========================================
    if (provider === "gemini") {
      const text = await callGemini(prompt);

      return NextResponse.json({ success: true, text });
    }

    // ==========================================
    // 🐳 ค่าย DeepSeek
    // ==========================================
    if (provider === "deepseek") {
      // ตั้งค่าให้วิ่งไปหา DeepSeek แทน ChatGPT
      const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com', // 👈 ชี้เป้าไปบ้าน DeepSeek
        apiKey: process.env.DEEPSEEK_API_KEY // 👈 ใช้กุญแจ DeepSeek
      });
      
      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "deepseek-chat", // 👈 ระบุชื่อโมเดลของ DeepSeek
      });
      return NextResponse.json({ success: true, text: completion.choices[0].message.content });
    }

    return NextResponse.json({ success: false, message: "ระบุชื่อค่าย AI ไม่ถูกต้อง" }, { status: 400 });

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ success: false, message: "AI มีปัญหา หรือใส่ Key ไม่ถูกต้อง" }, { status: 500 });
  }
}