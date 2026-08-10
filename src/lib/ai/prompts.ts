// src/lib/ai/prompts.ts
import { UserContext } from './recommendation'; // <--- 1. เพิ่มบรรทัดนี้ด้านบนสุด

// ==========================================
// ของเดิมที่คุณมี (ไม่ต้องแก้ เก็บไว้เหมือนเดิม)
// ==========================================
export function buildIngredientPrompt(
  ingredients: { name: string; quantity?: number; unit?: string }[],
  userContext?: {
    dietaryRestrictions?: string[]
    recentFavorites?: string[]
    searchHistory?: string[]
  },
): string {
  const ingredientList = ingredients
    .map((i) => {
      const suffix = i.quantity && i.unit ? ` (${i.quantity} ${i.unit})` : ""
      return `- ${i.name}${suffix}`
    })
    .join("\n")

  let contextBlock = ""
  if (userContext) {
    const parts: string[] = []
    if (userContext.dietaryRestrictions?.length) {
      parts.push(`ข้อจำกัดด้านอาหาร: ${userContext.dietaryRestrictions.join(", ")}`)
    }
    if (userContext.recentFavorites?.length) {
      parts.push(`เมนูที่ชอบ: ${userContext.recentFavorites.join(", ")}`)
    }
    if (parts.length) {
      contextBlock = `\n\nข้อมูลผู้ใช้:\n${parts.join("\n")}`
    }
  }

  return [
    "คุณคือเชฟผู้เชี่ยวชาญด้านการสร้างสูตรอาหารสำหรับนักศึกษา",
    "",
    "วัตถุดิบที่มี:",
    ingredientList,
    "",
    "กติกา:",
    "- ใช้วัตถุดิบที่มีเท่านั้น (ถ้าขาดให้เสนอสิ่งที่ใกล้เคียงที่สุด)",
    "- แต่ละเมนูต้องเหมาะสำหรับ 1 มื้อ (single-serving)",
    "- ใช้อุปกรณ์ทำอาหารพื้นฐานที่นักศึกษามี เช่น หม้อ กระทะ ไมโครเวฟ",
    "- งบประมาณจำกัด ใช้วัตถุดิบราคาประหยัด",
    "- แต่ละเมนูต้องมีคุณค่าทางโภชนาการครบถ้วนสำหรับ 1 มื้อ",
    `- ตอบกลับเป็น JSON เท่านั้น: { "menus": [{ "name": "...", "ingredients_needed": ["..."], "steps": ["..."], "serving_size": 1 }] }${contextBlock}`,
  ].join("\n")
}

// ==========================================
// 2. ฟังก์ชันใหม่สำหรับ Task 2 (ก๊อปมาต่อท้ายเลยครับ)
// ==========================================
export function buildRecommendationPrompt(context: UserContext): string {
  const favoritesText = context.favorites.length > 0 
    ? context.favorites.map(f => `- ${f}`).join('\n')
    : 'ไม่มีข้อมูลรายการโปรด';

  const searchHistoryText = context.searchHistory.length > 0 
    ? context.searchHistory.map(s => `- ${s}`).join('\n')
    : 'ไม่มีประวัติการค้นหา';

  const ratingsText = context.ratings.length > 0 
    ? context.ratings.map(r => `- ${r.recipeName} (${r.rating}/5 ดาว)`).join('\n')
    : 'ไม่มีประวัติการให้คะแนน';

  return `คุณคือ AI ผู้เชี่ยวชาญด้านการแนะนำอาหาร (Personalized Recipe Recommender)

หน้าที่ของคุณ:
วิเคราะห์พฤติกรรมและความชอบของผู้ใช้จากข้อมูลด้านล่าง แล้วแนะนำเมนูอาหารจำนวน 5 เมนูที่เหมาะสมกับผู้ใช้รายนี้มากที่สุด

[ข้อมูลประวัติพฤติกรรมของผู้ใช้]
เมนูโปรด (Favorites):
${favoritesText}

ประวัติการค้นหา (Search History):
${searchHistoryText}

ประวัติการให้คะแนน (Ratings & Reviews):
${ratingsText}

[ข้อกำหนดในการตอบกลับ]
1. แนะนำเมนูอาหารมา 5 เมนู ที่คิดว่าผู้ใช้จะชอบ โดยอิงจากข้อมูลประวัติด้านบน
2. ห้ามแนะนำเมนูที่ซ้ำกับเมนูที่ผู้ใช้เคยรีวิวหรือเป็น Favorite ไปแล้ว (หาเมนูใหม่ที่ใกล้เคียงแทน)
3. อธิบายเหตุผลสั้นๆ สำหรับแต่ละเมนูว่าทำไมถึงแนะนำ
4. ตอบกลับมาในรูปแบบ JSON Array เท่านั้น ตามโครงสร้างตัวอย่างนี้โดยไม่มีข้อความอื่นปะปน:

[
  {
    "recipeName": "ชื่อเมนูอาหารที่แนะนำ",
    "reason": "เหตุผลที่แนะนำเมนูนี้ อิงจากประวัติผู้ใช้"
  }
]`;
}