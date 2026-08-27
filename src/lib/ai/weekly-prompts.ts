/**
 * สร้าง prompt สร้างสูตรอาหารจากวัตถุดิบตามฤดูกาล
 * @param ingredients ชื่อวัตถุดิบตามฤดูกาลที่คัดจากฐานข้อมูลจริง
 * @param recipeCount จำนวนสูตรที่ต้องการ (2 สำหรับหน้านี้)
 */
export function buildSeasonalPrompt(
  ingredients: string[],
  recipeCount = 2
): string {
  return buildWeeklyPrompt(ingredients, recipeCount, "seasonal");
}

/**
 * สร้าง prompt สร้างสูตรอาหารจากวัตถุดิบยอดนิยม
 * @param ingredients ชื่อวัตถุดิบยอดนิยมที่คัดจากฐานข้อมูลจริง
 * @param recipeCount จำนวนสูตรที่ต้องการ (2 สำหรับหน้านี้)
 */
export function buildTrendingPrompt(
  ingredients: string[],
  recipeCount = 2
): string {
  return buildWeeklyPrompt(ingredients, recipeCount, "trending");
}

function buildWeeklyPrompt(
  focusedIngredients: string[],
  recipeCount: number,
  mode: "seasonal" | "trending"
): string {
  const modeLabel =
    mode === "seasonal"
      ? "วัตถุดิบตามฤดูกาล (กำลังอยู่ในช่วงที่เพาะปลูก/เก็บเกี่ยวได้ดีและสดใหม่)"
      : "วัตถุดิบยอดนิยม (เป็นวัตถุดิบที่ผู้ใช้งานในระบบให้ความนิยม/ใช้งานมากที่สุด)";

  const focusList = focusedIngredients.join(", ");

  return [
    "คุณคือเชฟผู้เชี่ยวชาญด้านการออกแบบเมนูอาหารไทย",
    "",
    `เงื่อนไขการสร้างเมนู: ${modeLabel}`,
    `วัตถุดิบหลักที่ต้องใช้ (เน้นใช้เหล่านี้เป็นตัวชูโรงของเมนู): ${focusList}`,
    "",
    "กติกา:",
    "- สร้างเมนูที่สมเหตุสมผล ทำได้จริง เหมาะสำหรับ 1 มื้อ (single-serving) งบประมาณจำกัด",
    "- ใช้อุปกรณ์พื้นฐานในครัวที่นักศึกษามี (หม้อ กระทะ ไมโครเวฟ)",
    "- ระบุส่วนผสมพร้อมปริมาณและหน่วย (เช่น กรัม, ช้อนโต๊ะ, ถ้วย) ให้ครบถ้วน",
    `- สร้างเมนูทั้งหมด ${recipeCount} เมนู โดยแต่ละเมนูต้องมีวัตถุดิบหลักจากรายการด้านบนอย่างน้อย 1 อย่าง`,
    "- ตอบกลับเป็น JSON เท่านั้น โดยไม่มีข้อความอื่นปะปน ตามโครงสร้างนี้:",
    `{ "recipes": [{ "recipeName": "...", "description": "...", "instructions": "1. ...\\n2. ...", "ingredients": [{ "name": "...", "quantity": 100, "unit": "กรัม" }] }] }`,
    "",
    "ข้อกำหนดเพิ่มเติม:",
    "- recipeName: ชื่อเมนูที่ชัดเจน",
    "- instructions: เขียนเป็นข้อความขั้นตอน คั่นด้วย \\n (ขึ้นบรรทัดใหม่) ระบุขั้นตอนชัดเจน",
    "- ingredients: array ของวัตถุดิบ โดย name ตรงกับชื่อวัตถุดิบหลัก/วัตถุดิบรองตามธรรมชาติดังที่เราให้ไว้",
  ].join("\n");
}
