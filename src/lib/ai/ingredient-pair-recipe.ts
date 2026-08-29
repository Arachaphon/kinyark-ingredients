import { prisma } from "@/lib/prisma";
import { upsertRecipeIngredients } from "@/lib/ingredients";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { weeklyAiRecipeSchema, type WeeklyAiRecipe } from "@/lib/validations/weekly.schema";

// ─────────────────────────────────────────────────────────────
// ตัวช่วย
// ─────────────────────────────────────────────────────────────
/**
 * key ของชุดวัตถุดิบ — จัดเรียง + trim + ทำให้ case-insensitive
 * เพื่อให้ {ไก่,ไข่} และ {ไข่,ไก่} เป็นชุดเดียวกัน (คืนเมนูเดิม)
 */
export function normalizeIngredientKey(ingredients: string[]): string {
  return Array.from(
    new Set(
      ingredients
        .map((i) => i.trim())
        .filter(Boolean)
        .map((i) => i.toLowerCase())
    )
  )
    .sort()
    .join(",");
}

/**
 * key ของเดือนปัจจุบัน เช่น "2026-08" — ใช้กำหนดอายุแคช 1 เดือน
 * เดือนใหม่จะถือว่าชุดเก่าหมดอายุ → สร้างเมนูใหม่ได้แม้ชุดเดิม
 */
export function getMonthKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** หา system user ที่เป็นเจ้าของสูตร AI (ใช้ user จริงตัวแรก/ADMIN ในระบบ) */
let _systemUserId: string | null = null;
async function getSystemUserId(): Promise<string> {
  if (_systemUserId) return _systemUserId;

  const admin = await prisma.user.findFirst({
    where: { role: { equals: "ADMIN" } },
    select: { id: true },
  });
  if (admin) {
    _systemUserId = admin.id;
    return admin.id;
  }

  const anyUser = await prisma.user.findFirst({ select: { id: true } });
  if (anyUser) {
    _systemUserId = anyUser.id;
    return anyUser.id;
  }

  const created = await prisma.user.create({
    data: { email: "ingredient-ai@kinyark.local", username: "KINYARK AI", role: "ADMIN" },
    select: { id: true },
  });
  _systemUserId = created.id;
  return created.id;
}

function cleanAiJson(raw: string): string {
  return raw.replace(/```json|```/g, "").trim();
}

/** URL รูปอาหาร (รูปแบบเดียวกับ weekly recs) */
export function buildRecipeImageUrl(recipeName: string, seed: number): string {
  const prompt = `close-up food photography, top-down view of ${recipeName} served on a plate, clean background, no people, no human, no hands, without people`;
  const negative = "people, person, hands, face, crowd, human, text, watermark, logo";
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=300&nologo=true&negative_prompt=${encodeURIComponent(negative)}&seed=${1000 + seed}`;
}

async function callGemini(prompt: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

/** ดึงรายชื่อเมนูที่มีอยู่ในระบบ เพื่อให้ AI หลีกเลี่ยงการสร้างเมนูซ้ำ */
async function getExistingRecipeNames(): Promise<string[]> {
  const rows = await prisma.recipe.findMany({
    where: { visibility: { not: "draft" } },
    select: { recipeName: true },
    take: 200,
  });
  return rows.map((r) => r.recipeName).filter(Boolean);
}

function buildPrompt(ingredients: string[], existingNames: string[]): string {
  const focusList = ingredients.join(", ");
  const existingList =
    existingNames.length > 0 ? existingNames.join(" | ") : "(ไม่มีข้อมูล)";

  return [
    "คุณคือเชฟผู้เชี่ยวชาญด้านการออกแบบเมนูอาหารไทย",
    "",
    `วัตถุดิบที่ผู้ใช้เลือก (จับคู่กันแล้ว ใช้เป็นตัวชูโรงของเมนู): ${focusList}`,
    "",
    "กติกา:",
    "- สร้างเมนูที่สมเหตุสมผล ทำได้จริง เหมาะสำหรับ 1 มื้อ งบประมาณจำกัด",
    "- ใช้อุปกรณ์พื้นฐานในครัว (หม้อ กระทะ ไมโครเวฟ)",
    "- ระบุส่วนผสมพร้อมปริมาณและหน่วย ให้ครบถ้วน และต้องมีวัตถุดิบหลักจากรายการที่เลือกไว้อย่างน้อย 1 อย่าง",
    "- สร้างเพียง 1 เมนูเท่านั้น",
    "- ห้ามตั้งชื่อเมนูซ้ำกับเมนูที่มีอยู่แล้วในระบบเด็ดขาด (ต้องไม่เหมือนหรือใกล้เคียงจนสับสน)",
    `- รายชื่อเมนูที่มีอยู่ในระบบแล้ว (ห้ามซ้ำ): ${existingList}`,
    "- ตอบกลับเป็น JSON เท่านั้น โดยไม่มีข้อความอื่นปะปน ตามโครงสร้างนี้:",
    `{ "recipes": [{ "recipeName": "...", "description": "...", "instructions": "1. ...\\n2. ...", "ingredients": [{ "name": "...", "quantity": 100, "unit": "กรัม" }] }] }`,
    "",
    "ข้อกำหนดเพิ่มเติม:",
    "- recipeName: ชื่อเมนูที่ชัดเจน และต้องไม่ซ้ำกับรายชื่อด้านบน",
    "- instructions: เขียนเป็นขั้นตอนเรียงลำดับ คั่นด้วย \\n",
    "- ingredients: array ของวัตถุดิบ โดย name ตรงตามธรรมชาติ",
    "- quantity ต้องเป็นตัวเลข (number) เท่านั้น เช่น 100, 200, 1.5 ห้ามใช้เศษส่วนแบบ 1/2 หรือ 1/4",
  ].join("\n");
}

/**
 * คืนเมนูที่ AI สร้างจากชุดวัตถุดิบที่เลือก.
 * - เลือกชุดเดิมซ้ำภายในเดือนเดียวกัน → คืนเมนูเดิม (ไม่เรียก AI ซ้ำ)
 * - เดือนใหม่ หรือชุดใหม่ → เรียก Gemini สร้าง 1 เมนู, บันทึกเป็น Recipe จริง + จดคู่
 * - AI ถูกสั่งห้ามสร้างเมนูที่ชื่อซ้ำกับที่เคยมีในระบบ
 */
export async function ensureIngredientPairRecipe(
  rawIngredients: string[]
): Promise<{
  recipe: {
    id: string;
    recipeName: string;
    description: string | null;
    instructions: string | null;
    aiProvider: string | null;
    imageUrl: string | null;
    ingredients: { name: string; quantity: number; unit: string }[];
    createdAt: string;
  };
  generated: boolean;
}> {
  const ingredients = rawIngredients
    .map((i) => i.trim())
    .filter(Boolean);
  if (ingredients.length === 0) {
    throw new Error("กรุณาระบุวัตถุดิบอย่างน้อย 1 ชนิด");
  }

  const ingredientKey = normalizeIngredientKey(ingredients);
  const monthKey = getMonthKey();

  // ลบ record ที่หมดอายุ (เดือนเก่า) เพื่อให้เดือนใหม่สร้างเมนูใหม่ได้
  await prisma.ingredientPairRecipe.deleteMany({
    where: { monthKey: { not: monthKey } },
  });

  // 1) ค้นหาชุดที่เคยสร้างไว้แล้วในเดือนนี้
  const cached = await prisma.ingredientPairRecipe.findUnique({
    where: { ingredientKey },
    include: {
      recipe: {
        include: {
          images: { orderBy: { createdAt: "asc" }, take: 1 },
          recipeIngredients: { include: { ingredient: true } },
        },
      },
    },
  });

  if (cached?.recipe) {
    return {
      recipe: toRecipeDto(cached.recipe),
      generated: false,
    };
  }

  // 2) เรียก Gemini สร้าง 1 เมนูจากชุดนี้ (หลีกเลี่ยงชื่อซ้ำกับในระบบ)
  const [existingNames, systemUserId] = await Promise.all([
    getExistingRecipeNames(),
    getSystemUserId(),
  ]);

  const prompt = buildPrompt(ingredients, existingNames);
  const raw = await callGemini(prompt);
  if (!raw) throw new Error("AI returned empty response");

  const parsed: unknown = JSON.parse(cleanAiJson(raw));
  const envelope = (parsed as { recipes?: unknown }).recipes;
  if (!Array.isArray(envelope) || envelope.length === 0) {
    throw new Error("AI response missing 'recipes' array");
  }

  const aiRecipe: WeeklyAiRecipe = weeklyAiRecipeSchema.parse(envelope[0]);

  // 3) บันทึกเป็น Recipe จริง + record จับคู่ ใน transaction เดียว
  const saved = await prisma.$transaction(
    async (tx) => {
      const uniqueIngredients = new Map<string, WeeklyAiRecipe["ingredients"][number]>();
      for (const ing of aiRecipe.ingredients) {
        if (!uniqueIngredients.has(ing.name.toLowerCase())) {
          uniqueIngredients.set(ing.name.toLowerCase(), ing);
        }
      }
      const deduped = [...uniqueIngredients.values()];

      const savedIngredients = await upsertRecipeIngredients(
        tx,
        deduped.map((i) => ({ name: i.name }))
      );

      const recipeIngredientsToCreate = savedIngredients.map((savedIngredient, index) => {
        const requested = deduped[index];
        return {
          ingredientId: savedIngredient.id,
          quantity: requested.quantity,
          unit: requested.unit,
        };
      });

      const imageUrl = buildRecipeImageUrl(aiRecipe.recipeName, ingredients.length);

      const recipe = await tx.recipe.create({
        data: {
          userId: systemUserId,
          recipeName: aiRecipe.recipeName,
          description: aiRecipe.description ?? null,
          instructions: aiRecipe.instructions,
          bgColor: null,
          aiProvider: "gemini",
          visibility: "public",
          recipeIngredients: { create: recipeIngredientsToCreate },
          ...(imageUrl ? { images: { create: [{ imageUrl }] } } : {}),
        },
        include: {
          images: { orderBy: { createdAt: "asc" }, take: 1 },
          recipeIngredients: { include: { ingredient: true } },
        },
      });

      await tx.ingredientPairRecipe.create({
        data: { ingredientKey, monthKey, recipeId: recipe.id },
      });

      return recipe;
    },
    { timeout: 30000, maxWait: 15000 }
  );

  // 4) Pre-warm รูป เพื่อให้ pollinations สร้างภาพก่อนผู้ใช้เปิดหน้า
  const warmUrl = saved.images?.[0]?.imageUrl;
  if (warmUrl) {
    void (async () => {
      try {
        const res = await fetch(warmUrl, { signal: AbortSignal.timeout(90000) });
        if (res.ok) await res.arrayBuffer();
      } catch {
        // ไม่สนใจ — ถ้าพลาดครั้งแรก browser จะโหลดเอง
      }
    })();
  }

  return { recipe: toRecipeDto(saved), generated: true };
}

function toRecipeDto(recipe: {
  id: string;
  recipeName: string;
  description: string | null;
  instructions: string | null;
  aiProvider: string | null;
  images?: { imageUrl: string }[];
  recipeIngredients?: { ingredient: { name: string }; quantity: number; unit: string }[];
  createdAt: Date;
}): {
  id: string;
  recipeName: string;
  description: string | null;
  instructions: string | null;
  aiProvider: string | null;
  imageUrl: string | null;
  ingredients: { name: string; quantity: number; unit: string }[];
  createdAt: string;
} {
  return {
    id: recipe.id,
    recipeName: recipe.recipeName,
    description: recipe.description,
    instructions: recipe.instructions,
    aiProvider: recipe.aiProvider,
    imageUrl: recipe.images?.[0]?.imageUrl ?? null,
    ingredients: (recipe.recipeIngredients ?? []).map((ri) => ({
      name: ri.ingredient.name,
      quantity: ri.quantity,
      unit: ri.unit,
    })),
    createdAt: recipe.createdAt.toISOString(),
  };
}
