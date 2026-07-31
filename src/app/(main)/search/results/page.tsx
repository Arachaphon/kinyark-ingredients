"use client";

import React, { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Anuphan } from "next/font/google";

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
  tags?: string[];
  user?: { username?: string; avatarUrl?: string };
  author?: string;
  authorAvatar?: string;
  favoriteCount?: number;
  likes?: number;
  rating?: number;
}

const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

// ✅ คลังรูปภาพอาหารไทยสำรองแบบหลากหลาย (ใช้กรณี Pollinations AI โหลดไม่ได้)
const FALLBACK_FOOD_IMAGES = [
  "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
];

const getRandomFallback = () => {
  return FALLBACK_FOOD_IMAGES[Math.floor(Math.random() * FALLBACK_FOOD_IMAGES.length)];
};

// Dictionary แปลงวัตถุดิบไทยเป็นคำศัพท์ภาษาอังกฤษ
const ingredientMap: Record<string, string> = {
  หมู: "pork",
  หมูกรอบ: "crispy pork",
  เนื้อแก้มวัว: "beef cheek",
  เนื้อวัว: "beef",
  เนื้อ: "beef",
  ไก่: "chicken",
  กุ้ง: "shrimp",
  หมึก: "squid",
  ปลา: "fish",
  เต้าหู้: "tofu",
  ไข่: "egg",
};

const getEnglishIngredient = (text: string) => {
  for (const [key, val] of Object.entries(ingredientMap)) {
    if (text.includes(key)) return val;
  }
  return "meat";
};

// สร้างรูป AI จากชื่อเมนูโดยตรง
const getAiImageUrl = (recipeName: string, index: number = 0) => {
  const prompt = encodeURIComponent(`
${recipeName},
authentic Thai food,
restaurant quality,
realistic food photography,
top view,
high detail,
4k,
served on a white plate
  `);

  return `https://image.pollinations.ai/prompt/${prompt}?width=500&height=350&seed=${1000 + index}`;
};

// ✅ ปรับให้เรียงเมนูจาก User ก่อน แล้วค่อยตามด้วยเมนู AI
const formatAndSortResults = (dataList: RecipeItem[]): RecipeItem[] => {
  const aiRecipes = dataList.filter((item) => item.isAi);
  const userRecipes = dataList.filter((item) => !item.isAi);

  userRecipes.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  aiRecipes.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  return [...userRecipes, ...aiRecipes];
};

function ResultsContent() {
  const searchParams = useSearchParams();
  const queryTitle = searchParams.get("query") || searchParams.get("ingredients") || "วัตถุดิบรวม";

  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<RecipeItem[]>([]);
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
    setIsLoading(true);

    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(queryTitle)}`);
        
        let data: ApiRecipeItem[] = [];
        if (response.ok) {
          data = await response.json();
        }

        if (!data || data.length === 0) {
          const aiResponse = await fetch("/api/ai/generate-recipe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ingredients: queryTitle.split(",") }),
          });

          if (aiResponse.ok) {
            data = await aiResponse.json();
          }
        }

        if (data && data.length > 0) {
          const formattedData: RecipeItem[] = data.map((item, index) => {
            const isAiRecipe = item.isAi !== undefined ? item.isAi : !!item.aiProvider;
            const recipeTitle = item.recipeName || item.title || `เมนูจาก ${queryTitle}`;

            const imageUrl =
              item.image?.trim() ||
              item.images?.[0]?.imageUrl?.trim();

            const finalImage =
              imageUrl && imageUrl.startsWith("http")
                ? imageUrl
                : getAiImageUrl(recipeTitle, index);

            console.log("Recipe:", recipeTitle);
            console.log("Image:", finalImage);

            const mappedTags =
              item.recipeIngredients
                ?.map((ri) => ri.ingredient?.name)
                .filter((name): name is string => Boolean(name)) ||
              item.tags ||
              queryTitle.split(",");

            return {
              id: item.id || `recipe-${Math.random()}`,
              title: recipeTitle,
              image: finalImage,
              tags: mappedTags,
              author: item.user?.username || item.aiProvider || item.author || "ผู้ใช้งานทั่วไป",
              authorAvatar:
                item.user?.avatarUrl ||
                item.authorAvatar ||
                "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png",
              likes: item.favoriteCount || item.likes || 0,
              rating: item.rating || 4.5,
              initialFavorite: false,
              isAi: isAiRecipe,
            };
          });

          const sortedData = formatAndSortResults(formattedData);

          if (isMounted) {
            setResults(sortedData);
            setupFavorites(sortedData);
          }
        } else {
          throw new Error("No recipes found");
        }
      } catch (error) {
        console.warn("Fallback dynamic recipes:", error);
        if (!isMounted) return;

        const dynamicList = queryTitle.split(",");
        const fallbackData: RecipeItem[] = [
          {
            id: `user-fb-1`,
            title: `ต้มยำ/แกง ${dynamicList.join(" และ ")} สูตรคุณแม่`,
            image: getAiImageUrl(`แกง ${queryTitle}`, 0),
            tags: dynamicList,
            author: "Ratatouille_Cook",
            authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
            likes: 42,
            rating: 4.8,
            initialFavorite: false,
            isAi: false,
          },
          {
            id: `ai-fb-1`,
            title: `ผัด ${dynamicList.join(" ")} รสเด็ด`,
            image: getAiImageUrl(`ผัด ${queryTitle}`, 1),
            tags: dynamicList,
            author: "Gemini AI",
            authorAvatar: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg",
            likes: 66,
            rating: 4.8,
            initialFavorite: false,
            isAi: true,
          },
          {
            id: `ai-fb-2`,
            title: `ผัด ${dynamicList.join(" ")} ซอสกลมกล่อม`,
            image: getAiImageUrl(`ผัด ${queryTitle}`, 2),
            tags: dynamicList,
            author: "Deep Seek",
            authorAvatar: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=150&q=80",
            likes: 52,
            rating: 4.5,
            initialFavorite: false,
            isAi: true,
          },
        ];

        setResults(fallbackData);
        setupFavorites(fallbackData);
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
  }, [queryTitle]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-8 md:p-12 shadow-sm min-h-[500px]">
      <div className="mb-8 flex items-baseline gap-2">
        <h1 className="text-3xl font-bold text-gray-900">{queryTitle}</h1>
        {!isLoading && (
          <span className="text-2xl font-medium text-gray-400">
            ({results.length})
          </span>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col md:flex-row gap-6 p-4 border border-gray-200 rounded-xl bg-white animate-pulse">
                <div className="w-full md:w-[180px] h-[160px] bg-gray-200 rounded-lg shrink-0"></div>
                <div className="flex-grow flex flex-col justify-between py-2">
                  <div className="h-8 bg-gray-200 rounded-md w-3/4 mb-4"></div>
                  <div className="h-6 w-20 bg-gray-200 rounded-md"></div>
                </div>
              </div>
            ))}
          </>
        ) : results.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <h3 className="text-2xl font-black text-gray-900 mb-3">ไม่พบสูตรอาหาร</h3>
            <Link href="/search" className="px-8 py-3 bg-[#71B254] text-white font-bold rounded-full">
              กลับไปเลือกวัตถุดิบใหม่
            </Link>
          </div>
        ) : (
          results.map((recipe, index) => {
            const isLiked = favorites[recipe.id];
            const cardBorderClass = recipe.isAi ? "border-[#71B254]" : "border-gray-200";

            return (
              <div
                key={`${recipe.id}-${index}`}
                className={`flex flex-col md:flex-row gap-6 p-4 border ${cardBorderClass} rounded-xl bg-white hover:shadow-md transition-shadow relative`}
              >
                <div className="w-full md:w-[180px] h-[160px] flex-shrink-0 relative bg-gray-100 rounded-lg overflow-hidden">
                <img
                    src={recipe.image || getRandomFallback()}
                    alt={recipe.title}
                    loading="lazy"
                    className="w-full h-full object-cover rounded-lg"
                    onLoad={() => {
                      console.log("โหลดสำเร็จ:", recipe.title);
                    }}
                    onError={(e) => {
                      console.log("โหลดไม่สำเร็จ:", recipe.title, recipe.image);

                      const target = e.currentTarget;

                      if (!target.dataset.retried) {
                        target.dataset.retried = "true";
                        target.src = getRandomFallback();
                      }
                    }}
                  />
                </div>

                <div className="flex-grow flex flex-col justify-between py-1">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      {recipe.title}
                      {recipe.isAi && <span className="text-lg" title="สร้างโดย AI">✨</span>}
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {recipe.tags &&
                        recipe.tags.map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-[#EAF5E4] text-[#5A9240] text-sm font-semibold px-3 py-1 rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4 md:mt-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gray-50 border border-gray-100 shrink-0 relative">
                      <img
                        src={recipe.authorAvatar}
                        alt={recipe.author}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-bold text-gray-800 text-sm truncate">
                      {recipe.author}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between w-full md:w-32 shrink-0 py-1">
                  <div className="flex flex-col items-end gap-3 w-full">
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
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      <span className="font-medium text-gray-700 text-lg">
                        {isLiked ? Number(recipe.likes) + 1 : recipe.likes}
                      </span>
                    </div>

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

                  <Link
                    href={`/recipe/${recipe.id}?title=${encodeURIComponent(recipe.title)}&tags=${encodeURIComponent((recipe.tags || []).join(","))}&image=${encodeURIComponent(recipe.image || "")}`}
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