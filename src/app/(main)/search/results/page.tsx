"use client";

import React, { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Anuphan } from "next/font/google";

// =========================================
// 📐 Interfaces
// =========================================
interface RecipeItem {
  id: string;
  title: string;
  image: string;
  tags: string[];
  author: string;
  authorAvatar: string;
  likes: number;
  rating: number;
  initialFavorite: boolean;
  isAi: boolean;
}

interface ApiRecipeItem {
  id: string;
  aiProvider?: string;
  isAi?: boolean;
  recipeName?: string;
  title?: string;
  images?: { imageUrl: string }[];
  image?: string;
  recipeIngredients?: { ingredient?: { name: string } }[];
  ingredients?: string[];
  tags?: string[];
  user?: { username?: string; avatarUrl?: string };
  author?: string;
  authorAvatar?: string;
  favoriteCount?: number;
  likes?: number;
  rating?: number;
}

// =========================================
// 🔤 ตั้งค่าฟอนต์ Anuphan
// =========================================
const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

// =========================================
// 🎨 ฟังก์ชันดึงรูปภาพ API อัตโนมัติสำหรับ AI
// =========================================
const getAiImageUrl = (recipeName: string, index: number = 0) => {
  const prompt = `${recipeName} top-down flat lay photo on an empty table, only the dish, food photography, no text`;
  const negative = "people, person, hands, face, crowd, text, watermark, logo";
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=300&nologo=true&negative_prompt=${encodeURIComponent(negative)}&seed=${1000 + index}`;
};

function ResultsContent() {
  const searchParams = useSearchParams();
  const ingredientsParam = searchParams.get("ingredients");
  const isIngredientSearch = ingredientsParam !== null;
  const queryTitle = searchParams.get("query") || searchParams.get("q") || ingredientsParam || "";

  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<RecipeItem[]>([]);
  
  // 🌟 เพิ่มสถานะสำหรับ Favorite (การกดถูกใจ) แบบแยกแต่ละ ID
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const setupFavorites = (dataArray: RecipeItem[]) => {
    const initialFavs = dataArray.reduce(
      (acc, current) => ({ ...acc, [current.id]: current.initialFavorite || false }),
      {}
    );
    setFavorites(initialFavs);
  };

  useEffect(() => {
    let isMounted = true;

    if (!queryTitle.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const fetchResults = async () => {
      try {
        const response = await fetch(
          isIngredientSearch
            ? `/api/search?ingredients=${encodeURIComponent(queryTitle)}`
            : `/api/search?q=${encodeURIComponent(queryTitle)}`
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch real data");
        }

        let data: ApiRecipeItem[] = await response.json();

        // ✨ ถ้าไม่พบสูตรจากฐานข้อมูลเลย ให้ขอเมนูแนะนำจาก AI Service แทน
        if (!Array.isArray(data) || data.length === 0) {
          try {
            const aiResponse = await fetch("/api/ai/generate-recipe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ingredients: queryTitle.split(",").map((s) => s.trim()).filter(Boolean) }),
            });

            if (aiResponse.ok) {
              data = await aiResponse.json();
            }
          } catch (aiError) {
            console.warn("AI Generate fallback error:", aiError);
          }
        }

        if (data && Array.isArray(data) && data.length > 0) {
          const formattedData: RecipeItem[] = data.map((item, index) => {
            const isAiRecipe = !!item.aiProvider || item.isAi || false;
            const recipeTitle = item.recipeName || item.title || "";

            const imageUrl = item.image?.trim() || item.images?.[0]?.imageUrl?.trim();
            const finalImage =
              imageUrl && imageUrl.startsWith("http")
                ? imageUrl
                : getAiImageUrl(recipeTitle || queryTitle, index);

            // 🟢 รวมวัตถุดิบจากทุกฟิลด์ที่ API ส่งมา
            let tempTags: string[] = [];

            if (Array.isArray(item.recipeIngredients)) {
              item.recipeIngredients.forEach((ri) => {
                if (ri?.ingredient?.name) tempTags.push(ri.ingredient.name);
              });
            }

            if (Array.isArray(item.ingredients)) {
              tempTags = [...tempTags, ...item.ingredients];
            }

            if (Array.isArray(item.tags)) {
              tempTags = [...tempTags, ...item.tags];
            }

            let mappedTags = Array.from(new Set(tempTags.filter((t) => typeof t === "string" && t.trim() !== "")));

            if (mappedTags.length === 0) {
              mappedTags = queryTitle.split(",").map((t) => t.trim()).filter(Boolean);
            }

            return {
              id: item.id,
              title: recipeTitle,
              image: finalImage,
              tags: mappedTags,
              author: item.user?.username || item.aiProvider || item.author || "ผู้ใช้งานทั่วไป",
              authorAvatar: item.user?.avatarUrl || item.authorAvatar || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png",
              likes: item.favoriteCount || item.likes || 0,
              rating: item.rating || 0,
              initialFavorite: false,
              isAi: isAiRecipe,
            };
          });

          if (isMounted) {
            setResults(formattedData);
            setupFavorites(formattedData);
          }
        } else if (isMounted) {
          setResults([]);
        }
      } catch (error) {
        console.warn("API Search Error:", error);
        if (!isMounted) return;

        setResults([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchResults();
    return () => { 
      isMounted = false; 
    };
  }, [queryTitle, isIngredientSearch]);

  // 🌟 ฟังก์ชันจัดการกดถูกใจ + Optimistic UI (ตอบสนองทันทีทุกคลิก)
  const toggleFavorite = (id: string) => {
    // 1. Optimistic UI: สลับสถานะหัวใจให้ผู้ใช้เห็นทันที
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));

    // 2. ยิง API; ถ้า server ปฏิเสธให้ revert กลับเพื่อซิงค์เสมอ
    const revert = () => setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
    fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId: id }),
    })
      .then((res) => {
        if (!res.ok) {
          console.warn("Favorite API failed, reverting UI state:", res.status);
          revert();
        }
      })
      .catch((error) => {
        console.error("Network error toggling favorite:", error);
        revert();
      });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-8 md:p-12 shadow-sm min-h-[500px]">

      {/* ส่วนหัว */}
      <div className="mb-8 flex items-baseline gap-2">
        <h1 className="text-3xl font-bold text-gray-900">{queryTitle}</h1>
        {!isLoading && (
          <span className="text-2xl font-medium text-gray-400">
            ({results.length})
          </span>
        )}
      </div>

      {/* ส่วนเนื้อหา */}
      <div className="flex flex-col gap-6">
        
        {/* 1. Loading State */}
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col md:flex-row gap-6 p-4 border border-gray-200 rounded-xl bg-white animate-pulse">
                <div className="w-full md:w-[180px] h-[160px] bg-gray-200 rounded-lg shrink-0"></div>
                <div className="flex-grow flex flex-col justify-between py-2">
                  <div>
                    <div className="h-8 bg-gray-200 rounded-md w-3/4 mb-4"></div>
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-gray-200 rounded-md"></div>
                      <div className="h-6 w-20 bg-gray-200 rounded-md"></div>
                      <div className="h-6 w-14 bg-gray-200 rounded-md"></div>
                    </div>
                  </div>
                  <div className="h-8 w-24 bg-gray-200 rounded-full mt-4 md:mt-0"></div>
                </div>
                <div className="w-full md:w-32 flex flex-col items-end justify-between py-1 shrink-0">
                  <div className="flex flex-col items-end gap-3 w-full">
                    <div className="h-6 w-12 bg-gray-200 rounded-md"></div>
                    <div className="h-6 w-12 bg-gray-200 rounded-md"></div>
                  </div>
                  <div className="mt-4 md:mt-0 h-10 w-full bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </>
        ) 
        
        /* 2. Empty State */
        : results.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="text-7xl mb-4 opacity-50">🧐</div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">
              {isIngredientSearch ? "ไม่มีสูตรอาหารที่ตรงกับวัตถุดิบ" : "ไม่พบสูตรอาหารที่ตรงกัน"}
            </h3>
            <p className="text-gray-500 text-lg max-w-md mb-8">
              {isIngredientSearch
                ? "ระบบไม่พบสูตรอาหารที่มีวัตถุดิบครบตามที่เลือก ลองปรับเปลี่ยนหรือลดวัตถุดิบดูนะ"
                : `ระบบไม่พบสูตรอาหารสำหรับ &quot;${queryTitle}&quot; ลองปรับเปลี่ยนวัตถุดิบ หรือใช้คำค้นหาที่กว้างขึ้นดูนะ`}
            </p>
            <Link
              href="/search"
              className="px-8 py-3 bg-[#71B254] text-white font-bold rounded-full hover:bg-[#5b9642] transition shadow-md"
            >
              กลับไปเลือกวัตถุดิบใหม่
            </Link>
          </div>
        ) 
        
        /* 3. Results */
        : (
          results.map((recipe, index) => {
            const isLiked = favorites[recipe.id];
            const cardBorderClass = recipe.isAi ? "border-[#71B254]" : "border-gray-200";

            // ✨ สูตรจาก AI ส่งข้อมูลผ่าน query params ส่วนสูตรจริงเปิดด้วย id จากฐานข้อมูล
            const detailHref = recipe.isAi
              ? `/recipe/${recipe.id}?title=${encodeURIComponent(recipe.title)}&tags=${encodeURIComponent((recipe.tags || []).join(","))}&image=${encodeURIComponent(recipe.image || "")}`
              : `/recipe/${recipe.id}`;

            return (
              <div
                key={`${recipe.id}-${index}`}
                className={`flex flex-col md:flex-row gap-6 p-4 border ${cardBorderClass} rounded-xl bg-white hover:shadow-md transition-shadow relative`}
              >
                {/* ซ้าย: รูปภาพอาหารตัวอย่าง */}
                <div className="w-full md:w-[180px] h-[160px] flex-shrink-0 relative">
                  <Image
                    src={recipe.image}
                    alt={recipe.title}
                    fill
                    unoptimized
                    className="object-cover rounded-lg"
                  />
                </div>

                {/* กลาง: รายละเอียด ชื่อสูตร, ป้ายวัตถุดิบ, คนโพสต์ */}
                <div className="flex-grow flex flex-col justify-between py-1">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      {recipe.title}
                      {recipe.isAi && <span className="text-lg" title="สร้างโดย AI">✨</span>}
                    </h3>

                    {/* ป้ายวัตถุดิบ (Tags) */}
                    <div className="flex flex-wrap gap-2">
                      {recipe.tags && recipe.tags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="bg-[#EAF5E4] text-[#5A9240] text-sm font-semibold px-3 py-1 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* ข้อมูลผู้สร้างสรรค์เมนู (User หรือ AI) */}
                  <div className="flex items-center gap-3 mt-4 md:mt-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gray-50 border border-gray-100 shrink-0 relative">
                      <Image
                        src={recipe.authorAvatar}
                        alt={recipe.author}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <span className="font-bold text-gray-800 text-sm truncate">
                      {recipe.author}
                    </span>
                  </div>
                </div>

                {/* ขวา: สถิติจำนวนคนกดใจ, ดาวคะแนน และปุ่ม View Recipe */}
                <div className="flex flex-col items-end justify-between w-full md:w-32 shrink-0 py-1">
                  <div className="flex flex-col items-end gap-3 w-full">
                    {/* ยอดกดไลก์หัวใจ (เพิ่ม Animation การตอบสนอง) */}
                    <div
                      onClick={() => toggleFavorite(recipe.id)}
                      className="flex items-center gap-2 cursor-pointer select-none group active:scale-95 transition-transform"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill={isLiked ? "#FF0000" : "none"}
                        stroke={isLiked ? "#FF0000" : "#A5A5A5"}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={isLiked ? "animate-fade-in transition-all duration-300 scale-110" : "hover:stroke-[#FF0000] transition-all duration-300"}
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      <span className="font-medium text-gray-700 text-lg">
                        {isLiked ? (Number(recipe.likes) + 1) : recipe.likes}
                      </span>
                    </div>

                    {/* คะแนนดาวความอร่อย */}
                    <div className="flex items-center gap-2">
                      <svg
                        width="22"
                        height="22"
                        fill="#F1C40F"
                        stroke="#F1C40F"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                      <span className="font-bold text-gray-900 text-lg">
                        {Number(recipe.rating).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* ปุ่มเปิดดูวิธีทำตัวเต็ม */}
                  <Link
                    href={detailHref}
                    className="mt-4 md:mt-0 w-full md:w-auto px-5 py-2.5 bg-[#71B254] text-white rounded-full text-sm font-bold hover:bg-[#5b9642] transition text-center shadow-sm block"
                  >
                    ดูสูตรอาหาร
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <div className={`${anuphan.className} min-h-screen bg-[#F5EFD7] pb-20 overflow-x-hidden`}>
      <Navbar />
      <main className="w-[95%] max-w-[1000px] mx-auto px-4 mt-8">
        <Suspense
          fallback={
            <div className="text-center py-20 font-bold text-[#71B254]">
              กำลังวิเคราะห์ข้อมูล...
            </div>
          }
        >
          <ResultsContent />
        </Suspense>
      </main>
    </div>
  );
}
