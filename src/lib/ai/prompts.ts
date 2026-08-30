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
