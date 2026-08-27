// src/app/api/recommendation/route.ts
import { NextResponse } from 'next/server';
import { getUserContext } from '@/lib/ai/recommendation';
import { buildRecommendationPrompt } from '@/lib/ai/prompts';
import OpenAI from 'openai';

// สร้าง instance สำหรับ Groq (ระบบจะดึง GROQ_API_KEY จาก .env.local อัตโนมัติ)
// ใช้ OpenAI SDK ต่อกับ Groq API ตามที่ repo ติดตั้งไว้แล้ว
const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    // เช็คว่ามีการส่ง userId   มาหรือไม่
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // 1. ดึงข้อมูลประวัติผู้ใช้ (Task 1)
    const userContext = await getUserContext(userId);

    // 2. สร้างข้อความ Prompt (Task 2)
    const prompt = buildRecommendationPrompt(userContext);

    // 3. ส่ง Prompt ให้ Groq AI ประมวลผล
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          // สั่งย้ำให้ AI ตอบกลับมาเป็น JSON เท่านั้น
          content: 'You are a helpful API that strictly outputs valid JSON only.' 
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      // ใช้โมเดล LLaMA 3 70B (เร็วและฉลาดมาก เหมาะกับงานนี้)
      model: 'llama-3.3-70b-versatile',
      // บังคับให้ AI ตอบกลับมาเป็นโครงสร้าง JSON
      response_format: { type: 'json_object' }, 
    });

    // 4. แปลงข้อความที่ AI ตอบกลับมาให้เป็น JSON Object
    const aiResponseText = completion.choices[0]?.message?.content;
    
    if (!aiResponseText) {
      throw new Error("AI returned empty response");
    }

    // แปลง Text ที่ได้ให้เป็น Object 
    const recommendations = JSON.parse(aiResponseText);

    // 5. ส่งผลลัพธ์กลับไปให้หน้าเว็บ (Frontend)
    return NextResponse.json({ 
      success: true, 
      data: recommendations 
    });

  } catch (error) {
    console.error('Error in Recommendation API:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' }, 
      { status: 500 }
    );
  }
}