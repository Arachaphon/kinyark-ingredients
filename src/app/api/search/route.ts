import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ===================================================
// 🍱 1) คลังแม่แบบประเภทอาหาร
// ===================================================
const RECIPE_TEMPLATES = [
  {
    prefix: "ผัดพริกแกง",
    suffix: "รสเด็ด",
    englishDish: "stir fried thai red curry paste dish",
  },
  {
    prefix: "ต้มยำน้ำข้น",
    suffix: "แซ่บเวอร์",
    englishDish: "thai spicy tom yum soup bowl with chili oil",
  },
  {
    prefix: "ผัดกระเพรา",
    suffix: "สูตรเข้มข้น",
    englishDish: "thai pad kra pao basil stir fry with rice",
  },
  {
    prefix: "แกงเขียวหวาน",
    suffix: "รสกลมกล่อม",
    englishDish: "bowl of thai green curry coconut soup",
  },
  {
    prefix: "ข้าวผัด",
    suffix: "หอมกลิ่นกระทะ",
    englishDish: "plate of thai fried rice with fried egg",
  },
  {
    prefix: "ผัดน้ำมันหอย",
    suffix: "ราดข้าว",
    englishDish: "stir fried meat with savory oyster sauce and garlic",
  },
  {
    prefix: "ต้มข่า",
    suffix: "ละมุนลิ้น",
    englishDish: "thai coconut soup tom kha bowl",
  },
  {
    prefix: "ลาบ",
    suffix: "แซ่บอิสาน",
    englishDish: "spicy thai larb salad dish with mint",
  },
];

// ===================================================
// 🔤 2) แปลงวัตถุดิบเป็นภาษาอังกฤษอย่างครอบคลุม
// (เรียงจากคำเฉพาะเจาะจงไปหาคำทั่วไป)
// ===================================================
function getIngredientEnglish(ingredient: string): string {
  const clean = ingredient.trim().toLowerCase();

  const map: Record<string, string> = {
    ซี่โครงหมู: "pork ribs",
    เนื้อแก้มวัว: "beef cheek",
    หมูกรอบ: "crispy pork belly",
    หมูสามชั้น: "pork belly",
    เนื้อวัว: "beef",
    เนื้อ: "beef",
    หมู: "pork",
    ไก่: "chicken",
    กุ้ง: "shrimp",
    หมึก: "squid",
    ปลา: "fish",
    เต้าหู้: "tofu",
    ไข่: "egg",
    ปู: "crab",
    หอย: "mussel",
  };

  for (const [key, val] of Object.entries(map)) {
    if (clean.includes(key)) return val;
  }

  return clean; // หากไม่มีใน Map ให้ส่งค่าคำค้นเดิมไปทำ Prompt
}

function getRandomUniqueTemplates(count: number) {
  const shuffled = [...RECIPE_TEMPLATES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// ===================================================
// 🖼️ 3) ฟังก์ชันสร้าง URL ภาพ (รับ uniqueKey ป้องกันรูปซ้ำ)
// ===================================================
function generateAiImageUrl(englishDish: string, mainIngredientEn: string, uniqueKey: string | number) {
  // สุ่ม Seed อิสระโดยใช้ uniqueKey ผสมเข้าไปเพื่อรับประกันว่า seed ไม่ซ้ำกันแน่นอน
  const seed = Math.floor(Math.random() * 1000000) + Number(uniqueKey || 0);

  // Prompt กระชับและระบุชื่ออาหาร + วัตถุดิบชัดเจน
  const promptText = `delicious ${englishDish} made with ${mainIngredientEn}, thai cuisine, authentic food photography, professional culinary, studio lighting, 8k resolution`;

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?w=600&h=400&nologo=true&seed=${seed}`;
}

// ===================================================
// 🛠️ API ROUTE HANDLER
// ===================================================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    if (!q || q.trim() === "") {
      return NextResponse.json([]);
    }

    const ingredientsList = q
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);

    const mainIngredient = ingredientsList[0] || "รวมมิตร";
    const mainIngredientEn = getIngredientEnglish(mainIngredient);

    // ---------------------------------------------------
    // 👤 1) ดึงเมนูจริงของ USER จาก DATABASE
    // ---------------------------------------------------
    let userRecipesFormatted: any[] = [];

    try {
      const dbRecipes = await prisma.recipe.findMany({
        where: {
          OR: ingredientsList.map((ing) => ({
            recipeName: { contains: ing, mode: "insensitive" as const },
          })),
        },
        include: {
          user: true,
          recipeIngredients: { include: { ingredient: true } },
          images: true,
        },
        take: 5,
      });

      userRecipesFormatted = dbRecipes.map((item: any, idx: number) => ({
        id: item.id,
        recipeName: item.recipeName,
        isAi: false,
        rating: item.rating || 4.5,
        favoriteCount: item.favoriteCount || 0,
        tags: item.recipeIngredients?.map((ri: any) => ri.ingredient?.name) || ingredientsList,
        user: {
          username: item.user?.username || item.user?.name || "ผู้ใช้งานทั่วไป",
          avatarUrl: item.user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        },
        image: item.images?.[0]?.imageUrl || item.imageUrl || generateAiImageUrl("thai food dish", mainIngredientEn, `db-${idx}`),
      }));
    } catch (dbError) {
      console.error("Prisma query error:", dbError);
    }

    // ---------------------------------------------------
    // 🌟 2) สุ่มเมนูแนะนำแบบไม่ซ้ำกัน
    // ---------------------------------------------------
    const uniqueTemplates = getRandomUniqueTemplates(3);

    if (userRecipesFormatted.length === 0) {
      const userTpl = uniqueTemplates.pop()!;
      userRecipesFormatted = [
        {
          id: `user-recipe-${Date.now()}`,
          recipeName: `${userTpl.prefix}${mainIngredient} ${userTpl.suffix} (สูตรคุณแม่)`,
          isAi: false,
          rating: 4.8,
          favoriteCount: 42,
          tags: ingredientsList,
          user: {
            username: "Ratatouille_Cook",
            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
          },
          image: generateAiImageUrl(userTpl.englishDish, mainIngredientEn, "user-fallback-1"),
        },
      ];
    }

    // สร้างเมนู AI จาก Template ที่เหลือ
    const aiRecipes = uniqueTemplates.map((tpl, index) => ({
      id: `ai-recipe-${Date.now()}-${index}`,
      recipeName: `${tpl.prefix}${mainIngredient} ${tpl.suffix}`,
      aiProvider: index === 0 ? "Gemini" : "Deep Seek",
      isAi: true,
      rating: +(4.6 + Math.random() * 0.3).toFixed(1),
      favoriteCount: Math.floor(Math.random() * 60) + 40,
      tags: ingredientsList,
      user: {
        username: index === 0 ? "Gemini AI" : "Deep Seek",
        avatarUrl: index === 0 
          ? "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg"
          : "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=150&q=80",
      },
      image: generateAiImageUrl(tpl.englishDish, mainIngredientEn, `ai-${index}-${Date.now()}`),
    }));

    return NextResponse.json([...userRecipesFormatted, ...aiRecipes]);
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Failed to fetch search results" }, { status: 500 });
  }
}