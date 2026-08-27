import { prisma } from "@/lib/prisma";
import { upsertRecipeIngredients } from "@/lib/ingredients";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { buildSeasonalPrompt, buildTrendingPrompt } from "@/lib/ai/weekly-prompts";
import { weeklyAiRecipeSchema, type WeeklyAiRecipe } from "@/lib/validations/weekly.schema";

// ─────────────────────────────────────────────────────────────
// ค่าคงที่
// ─────────────────────────────────────────────────────────────
const EACH_LABEL = 2; // แต่ละประเภท (seasonal / trending) ได้ 2 สูตร = รวม 4

// แผนที่ฤดูกาล → ชื่อวัตถุดิบจริง. สมาชิกต้องตรงกับชื่อ Ingredient ใน DB จริง
// (เราจะกรองให้เหลือเฉพาะชื่อที่อยู่ในระบบจริงเสมอ ไม่ใช่ข้อมูลหลอก)
const SEASONAL_INGREDIENTS: Record<string, string[]> = {
  // เดือนที่ร้อนฝนน้อย (มี.ค. – เม.ย.)
  "03": ["มะม่วง", "สับปะรด", "มะปราง", "มะยงชิด", "แตงโม"],
  "04": ["มะม่วง", "สับปะรด", "มะปราง", "มะยงชิด", "ทุเรียน"],
  // ต้นฤดูฝน (พ.ค. - มิ.ย.)
  "05": ["มะละกอ", "ฟักทอง", "ข้าวโพด", "ผักบุ้ง", "ถั่วฝักยาว"],
  "06": ["มะละกอ", "ฟักทอง", "ข้าวโพด", "ผักบุ้ง", "เห็ด"],
  // กลางฤดูฝน (ก.ค. – ส.ค.)
  "07": ["เห็ด", "ข้าวโพด", "ฟักทอง", "ผักบุ้ง", "กะหล่ำปลี"],
  "08": ["เห็ด", "ข้าวโพด", "ฟักทอง", "ผักบุ้ง", "สับปะรด"],
  // ปลายฤดูฝน (ก.ย. – ต.ค.)
  "09": ["กล้วย", "แก้วมังกร", "ลำไย", "กะหล่ำปลี", "ฟักทอง"],
  "10": ["กล้วย", "แก้วมังกร", "ลำไย", "เงาะ", "ฟักทอง"],
  // ปลายฝนต้นหนาว (พ.ย.)
  "11": ["แอปเปิ้ล", "องุ่น", "ส้ม", "กะหล่ำปลี", "แครอท"],
  // ฤดูหนาว (ธ.ค. – ก.พ.)
  "12": ["แอปเปิ้ล", "องุ่น", "ส้ม", "แครอท", "มันฝรั่ง"],
  "01": ["แอปเปิ้ล", "องุ่น", "ส้ม", "แครอท", "มันฝรั่ง"],
  "02": ["แอปเปิ้ล", "องุ่น", "ส้ม", "แครอท", "มันฝรั่ง"],
};

const TOTAL_PER_TYPE = 2;

// ─────────────────────────────────────────────────────────────
// ตัวช่วย
// ─────────────────────────────────────────────────────────────

/** หา ISO week key เช่น "2026-W35" เพื่อกันการเรียก AI ซ้ำในสัปดาห์เดียวกัน */
export function getWeekKey(date = new Date()): string {
  const target = new Date(date.getTime());
  const dayNum = (target.getDay() + 6) % 7; // จ.-อาทิตย์
  target.setDate(target.getDate() - dayNum + 3); // ไปที่วันพฤหัสของสัปดาห์
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDay + 3);
  const weekNo = 1 + Math.round(
    (target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  const year = target.getFullYear();
  return `${year}-W${String(weekNo).padStart(2, "0")}`;
}

/** สุ่มรายการวัตถุดิบประเภทหนึ่ง (seasonal / trending) ด้วยจำนวนที่กำหนด */
function sample<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function cleanAiJson(raw: string): string {
  return raw.replace(/```json|```/g, "").trim();
}

/** สร้าง URL รูปภาพอาหารอัตโนมัติ (รูปแบบเดียวกับที่ใช้ในหน้าค้นหา) */
export function buildRecipeImageUrl(recipeName: string, seed: number): string {
  const prompt = `${recipeName} delicious thai food photography realistic`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=300&nologo=true&seed=${1000 + seed}`;
}

// ─────────────────────────────────────────────────────────────
// ดึงข้อมูลวัตถุดิบจริงจากฐานข้อมูล
// ─────────────────────────────────────────────────────────────

/**
 * วัตถุดิบตามฤดูกาล: กรองวัตถุดิบที่อยู่ในแผนที่ฤดูกาลของเดือนปัจจุบัน
 * โดยใช้เฉพาะชื่อที่มีอยู่จริงในตาราง ingredients
 */
async function getSeasonalIngredientNames(): Promise<string[]> {
  const monthKey = String(new Date().getMonth() + 1).padStart(2, "0");
  const candidates = SEASONAL_INGREDIENTS[monthKey] ?? [];

  if (candidates.length === 0) return [];

  const found = await prisma.ingredient.findMany({
    where: { name: { in: candidates } },
    select: { name: true },
  });

  return sample(found.map((i) => i.name), TOTAL_PER_TYPE * 2);
}

/**
 * วัตถุดิบยอดนิยม: นับจำนวนครั้งที่วัตถุดิบถูกใช้ในสูตรทั้งหมด (ตาราง recipe_ingredients)
 * แล้วเรียงจากมากไปน้อย — เป็นข้อมูลจริงจากระบบ ไม่ใช่ mock
 */
async function getTrendingIngredientNames(): Promise<string[]> {
  const grouped = await prisma.recipeIngredient.groupBy({
    by: ["ingredientId"],
    _count: { _all: true },
  });

  const sorted = grouped.sort(
    (a, b) => (b._count._all ?? 0) - (a._count._all ?? 0)
  );
  const topIds = sorted.slice(0, 30).map((g) => g.ingredientId);

  const ingredients = await prisma.ingredient.findMany({
    where: { id: { in: topIds } },
    select: { id: true, name: true },
  });

  const byId = new Map(ingredients.map((i) => [i.id, i.name]));
  const names = topIds
    .map((id) => byId.get(id))
    .filter((n): n is string => Boolean(n));

  return sample(names, TOTAL_PER_TYPE * 2);
}

// ─────────────────────────────────────────────────────────────
// เรียก AI
// ─────────────────────────────────────────────────────────────

async function callGemini(prompt: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function callGroq(prompt: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }
  const groq = new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
  });
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a helpful API that strictly outputs valid JSON only.",
      },
      { role: "user", content: prompt },
    ],
    model: "groq/compound",
    response_format: { type: "json_object" },
  });
  return completion.choices[0]?.message?.content ?? "";
}

/**
 * เรียก AI หนึ่งเจ้าตาม prompt แล้ว validate โครงสร้าง + รับ recipe จำนวนที่ต้องการ
 */
async function requestRecipes(
  provider: "gemini" | "groq",
  prompt: string
): Promise<WeeklyAiRecipe[]> {
  const raw =
    provider === "gemini" ? await callGemini(prompt) : await callGroq(prompt);
  if (!raw) throw new Error("AI returned empty response");

  const parsed: unknown = JSON.parse(cleanAiJson(raw));
  const envelope = (parsed as { recipes?: unknown }).recipes;
  if (!Array.isArray(envelope)) {
    throw new Error("AI response missing 'recipes' array");
  }

  const recipes = envelope.map((item) => weeklyAiRecipeSchema.parse(item));
  // ตัดให้ได้ตามจำนวนที่กำหนด
  return recipes.slice(0, EACH_LABEL);
}

// ─────────────────────────────────────────────────────────────
// ตรวจสอบว่า Recipe.userId เป็น required — ต้องมีผู้ใช้จริง
// ─────────────────────────────────────────────────────────────
// หมายเหตุ: schema เขียน `userId String @db.Uuid` ไม่มี default ดังนั้นทุกสูตรต้องมีเจ้าของจริง
// เราจึงต้อง ensure ว่ามี user อย่างน้อยหนึ่งคนในระบบ เพื่อใช้เป็นเจ้าของสูตรที่ AI สร้าง

let _systemUserId: string | null = null;

/** ดึง/สร้าง system user สำหรับเจ้าของสูตรที่ AI สร้าง (ใช้ข้อมูล user จริงในระบบ) */
async function getSystemUserId(): Promise<string> {
  if (_systemUserId) return _systemUserId;

  const existing = await prisma.user.findFirst({
    where: { role: { equals: "ADMIN" } },
    select: { id: true },
  });
  if (existing) {
    _systemUserId = existing.id;
    return existing.id;
  }

  const anyUser = await prisma.user.findFirst({ select: { id: true } });
  if (anyUser) {
    _systemUserId = anyUser.id;
    return anyUser.id;
  }

  // ทางเลือกสุดท้าย: สร้าง system account ขึ้นมา (ใช้ข้อมูลจริง ไม่ใช่ recipe mock)
  const created = await prisma.user.create({
    data: {
      email: `weekly-ai@kinyark.local`,
      username: "KINYARK AI",
      role: "ADMIN",
    },
    select: { id: true },
  });
  _systemUserId = created.id;
  return created.id;
}

// ─────────────────────────────────────────────────────────────
// ฟังก์ชันหลัก
// ─────────────────────────────────────────────────────────────

/**
 * คืนชุดสูตรแนะนำของสัปดาห์ปัจจุบัน.
 * - ถ้ายังไม่มีในสัปดาห์นี้ → เรียก AI 2 ตัว สร้าง 2+2 สูตร แล้วบันทึกเป็น Recipe จริง + WeeklyRecommendation
 * - ถ้ามีแล้ว → คืนจากฐานข้อมูล (ไม่เรียก AI ซ้ำ)
 */
export async function ensureWeeklyRecommendations() {
  const weekKey = getWeekKey();
  const existing = await prisma.weeklyRecommendation.findMany({
    where: { weekKey },
    include: { recipe: { include: { images: { orderBy: { createdAt: "asc" }, take: 1 } } } },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
  });

  if (existing.length >= 4) {
    return { weekKey, recipes: existing, generated: false };
  }

  const systemUserId = await getSystemUserId();

  const [seasonalIngredients, trendingIngredients] = await Promise.all([
    getSeasonalIngredientNames(),
    getTrendingIngredientNames(),
  ]);

  // ถ้าไม่มีวัตถุดิบจริงเลย ให้ใช้ fallback เป็นคำกว้าง ๆ ที่สมเหตุสมผล
  const seasonalFallback =
    seasonalIngredients.length > 0
      ? seasonalIngredients
      : ["ผัก", "ไก่", "ไข่"];
  const trendingFallback =
    trendingIngredients.length > 0
      ? trendingIngredients
      : ["ไก่", "หมู", "ไข่"];

  // เรียก AI ทั้ง 2 เจ้าคู่ขนาน
  const [seasonalPrompt, trendingPrompt] = [
    buildSeasonalPrompt(seasonalFallback),
    buildTrendingPrompt(trendingFallback),
  ];

  const [seasonalRecipes, trendingRecipes] = await Promise.all([
    requestRecipes("gemini", seasonalPrompt),
    requestRecipes("groq", trendingPrompt),
  ]);

  // บันทึกทั้งหมดใน transaction เดียว (รับประกันว่าถ้าพังจะไม่เหลือครึ่งเดียว)
  await prisma.$transaction(async (tx) => {
    // ใช้ transaction client สำหรับสร้าง recipe ที่ต้องมีเจ้าของ
    const buildPersist = async (recipe: WeeklyAiRecipe, provider: string, type: "seasonal" | "trending", seed: number) => {
      const savedIngredients = await upsertRecipeIngredients(
        tx,
        recipe.ingredients.map((i) => ({ name: i.name }))
      );
      const recipeIngredientsToCreate = savedIngredients.map((savedIngredient, index) => {
        const requested = recipe.ingredients[index];
        return {
          ingredientId: savedIngredient.id,
          quantity: requested.quantity,
          unit: requested.unit,
        };
      });
      const imageUrl = buildRecipeImageUrl(recipe.recipeName, seed);
      return tx.recipe.create({
        data: {
          userId: systemUserId,
          recipeName: recipe.recipeName,
          description: recipe.description ?? null,
          instructions: recipe.instructions,
          bgColor: null,
          aiProvider: provider,
          visibility: "public",
          recipeIngredients: { create: recipeIngredientsToCreate },
          ...(imageUrl ? { images: { create: [{ imageUrl }] } } : {}),
        },
      });
    };

    const createdSeasonal = [];
    for (let i = 0; i < seasonalRecipes.length; i++) {
      createdSeasonal.push(await buildPersist(seasonalRecipes[i], "gemini", "seasonal", i));
    }
    const createdTrending = [];
    for (let i = 0; i < trendingRecipes.length; i++) {
      createdTrending.push(await buildPersist(trendingRecipes[i], "groq", "trending", seasonalRecipes.length + i));
    }

    await tx.weeklyRecommendation.createMany({
      data: [
        ...createdSeasonal.map((r, i) => ({ weekKey, type: "seasonal" as const, recipeId: r.id, createdAt: new Date(Date.now() + i) })),
        ...createdTrending.map((r, i) => ({ weekKey, type: "trending" as const, recipeId: r.id, createdAt: new Date(Date.now() + createdSeasonal.length + i) })),
      ],
    });
  }, {
    timeout: 20000,
    maxWait: 5000,
  });

  const recipes = await prisma.weeklyRecommendation.findMany({
    where: { weekKey },
    include: { recipe: { include: { images: { orderBy: { createdAt: "asc" }, take: 1 } } } },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
  });

  return { weekKey, recipes, generated: true };
}
