import { NextResponse } from 'next/server';
import { getUserContext } from '@/lib/ai/recommendation';
import { buildRecommendationPrompt } from '@/lib/ai/prompts';
import Groq from 'groq-sdk';

const tempKey = "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";
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || tempKey,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // 1. ดึงข้อมูลประวัติผู้ใช้
    const userContext = await getUserContext(userId);

    // --- OPTIMIZATION START (Task 4) ---
    // จำกัดข้อมูลที่ส่งให้ AI: เลือกเฉพาะ 5 รายการล่าสุดเพื่อลด Payload
        const optimizedContext = {
        ...(userContext as any), // ใส่ (userContext as any) ตรงนี้ครับ
        history: (userContext as any).history?.slice(-5) || [], 
      };
    // --- OPTIMIZATION END ---

    // 2. สร้างข้อความ Prompt โดยใช้ข้อมูลที่ผ่านการ Optimized แล้ว
    const prompt = buildRecommendationPrompt(optimizedContext);

    // 3. ส่ง Prompt ให้ Groq AI ประมวลผล
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          // ปรับ System Prompt ให้สั้นและเน้นย้ำเรื่อง JSON เพื่อประสิทธิภาพ
          content: 'You are a helpful API that strictly outputs valid JSON only.' 
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }, 
      temperature: 0.5, // ลดความฟุ้งซ่านเพื่อให้คำตอบแม่นยำขึ้น
      max_tokens: 500,  // จำกัด Token ขาออกเพื่อความเร็ว
    });

    const aiResponseText = completion.choices[0]?.message?.content;
    
    if (!aiResponseText) {
      throw new Error("AI returned empty response");
    }

    const recommendations = JSON.parse(aiResponseText);

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