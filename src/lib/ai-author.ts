// 🗂️ แผนที่เจ้าของสูตรที่สร้างโดย AI — ใช้ร่วมกันทั่วทั้งระบบ
// คืนชื่อ + โลโก้ของ AI ที่สร้างเมนูนั้น ๆ แทนที่จะโชว์ user จริง "PT"

export interface AiAuthorInfo {
  name: string;
  logo: string;
}

const AI_AUTHORS: Record<string, AiAuthorInfo> = {
  gemini: { name: "Gemini", logo: "/ai/gemini.svg" },
  groq: { name: "Groq", logo: "/ai/groq.svg" },
  deepseek: { name: "DeepSeek", logo: "/ai/gemini.svg" },
};

/** คืนข้อมูล AI ถ้า aiProvider เป็นค่าที่เรารู้จัก มิฉะนั้นคืน null */
export function getAiAuthor(aiProvider?: string | null): AiAuthorInfo | null {
  if (!aiProvider) return null;
  const key = aiProvider.toLowerCase();
  return AI_AUTHORS[key] ?? null;
}

/** ชื่อ AI จาก aiProvider (หรือคืนค่าว่าง) */
export function getAiAuthorName(aiProvider?: string | null): string | null {
  return getAiAuthor(aiProvider)?.name ?? null;
}
