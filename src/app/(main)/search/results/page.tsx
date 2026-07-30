"use client";

import React, { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Anuphan } from "next/font/google";

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
const getAiImageUrl = (recipeName: string) => {
  // ใช้บริการสร้างรูปภาพ AI อัตโนมัติฟรี (เปลี่ยนเป็น API หลังบ้านของคุณได้เลย)
  const prompt = `${recipeName} delicious food photography realistic`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=300&nologo=true`;
};

// =========================================
// 🍱 ข้อมูลจำลองเมนู (Mock Data)
// =========================================
const mockSearchResults = [
  {
    id: "mock-1",
    title: "สลัดซีซาร์สวนผัก",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80",
    tags: ["มะเขือเทศ", "หัวหอมหวาน", "พริกไทย", "กะหล่ำปลี"],
    author: "Alice",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    likes: 22,
    rating: 3.0,
    initialFavorite: false,
    isAi: false, 
  },
  {
    id: "mock-2",
    title: "สลัด (ง่ายและสดใหม่)",
    image: getAiImageUrl("สลัด ง่ายและสดใหม่"),
    tags: ["แตงกวา", "มะเขือเทศ", "แครอท", "ผักสลัด"],
    author: "Deep Seek", 
    authorAvatar: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=150&q=80", 
    likes: 52,
    rating: 4.5,
    initialFavorite: false,
    isAi: true, 
  },
  {
    id: "mock-3",
    title: "สลัดผลไม้สดชื่น",
    image: getAiImageUrl("สลัดผลไม้สดชื่น"),
    tags: ["สับปะรด", "สตรอว์เบอร์รี", "องุ่น", "ส้ม", "กีวี"],
    author: "Gemini", 
    authorAvatar: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg",
    likes: 65,
    rating: 4.8, 
    initialFavorite: true,
    isAi: true, 
  },
  {
    id: "mock-4",
    title: "สลัดอกไก่ย่างคลีนๆ",
    image: "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=300&q=80",
    tags: ["อกไก่", "ผักกาดหอม", "แครอท", "น้ำสลัดงา"],
    author: "Chef_Pond",
    authorAvatar: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=150&q=80",
    likes: 120,
    rating: 4.9, 
    initialFavorite: false,
    isAi: false, 
  },
  {
    id: "mock-5",
    title: "สลัดอะโวคาโดกุ้งย่าง",
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=300&q=80",
    tags: ["อะโวคาโด", "กุ้ง", "มะนาว", "ผักร็อกเก็ต"],
    author: "HealthyGirl",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    likes: 85,
    rating: 4.2,
    initialFavorite: false,
    isAi: false, 
  },
];

// =========================================
// 🔄 ฟังก์ชันจัดเรียง (AI ขึ้นก่อน เรียงตามเรตติ้ง)
// =========================================
const formatAndSortResults = (dataList: any[]) => {
  const aiRecipes = dataList.filter((item) => item.isAi);
  const userRecipes = dataList.filter((item) => !item.isAi);

  aiRecipes.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  userRecipes.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  return [
    ...aiRecipes.slice(0, 2),
    ...userRecipes.slice(0, 3)
  ];
};

function ResultsContent() {
  const searchParams = useSearchParams();
  const queryTitle = searchParams.get("query") || searchParams.get("ingredients") || "สลัด";

  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(queryTitle)}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch real data");
        }

        const data = await response.json();

        if (data && data.length > 0) {
          const formattedData = data.map((item: any) => {
            const isAiRecipe = !!item.aiProvider || item.isAi || false;
            const recipeTitle = item.recipeName || item.title;

            const finalImage = item.images?.[0]?.imageUrl || item.image || 
                               (isAiRecipe ? getAiImageUrl(recipeTitle) : "https://images.unsplash.com/photo-1490474418585-ba9f52fce124");

            return {
              id: item.id,
              title: recipeTitle,
              image: finalImage,
              tags: item.recipeIngredients?.map((ri: any) => ri.ingredient?.name).filter(Boolean).slice(0, 5) || item.tags || [],
              author: item.user?.username || item.author || "ผู้ใช้งานทั่วไป",
              authorAvatar: item.user?.avatarUrl || item.authorAvatar || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png",
              likes: item.favoriteCount || item.likes || 0,
              rating: item.rating || 0,
              initialFavorite: false,
              isAi: isAiRecipe,
            };
          });

          const sortedAndSlicedData = formatAndSortResults(formattedData);

          if (isMounted) {
            setResults(sortedAndSlicedData);
            setupFavorites(sortedAndSlicedData);
          }
        } else {
          throw new Error("Real data is empty, using fallback");
        }

      } catch (error) {
        console.warn("Using mock data fallback:", error);
        if (!isMounted) return;

        if (queryTitle.toLowerCase().includes("ไม่มี") || queryTitle.toLowerCase().includes("empty")) {
          setResults([]);
        } else {
          const sortedMockData = formatAndSortResults(mockSearchResults);
          setResults(sortedMockData);
          setupFavorites(sortedMockData);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchResults, 800);
    return () => { 
      isMounted = false; 
      clearTimeout(timer);
    };
  }, [queryTitle]);

  const setupFavorites = (dataArray: any[]) => {
    const initialFavs = dataArray.reduce(
      (acc, current) => ({ ...acc, [current.id]: current.initialFavorite || false }),
      {}
    );
    setFavorites(initialFavs);
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
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
            <h3 className="text-2xl font-black text-gray-900 mb-3">ไม่พบสูตรอาหารที่ตรงกัน</h3>
            <p className="text-gray-500 text-lg max-w-md mb-8">
              ระบบไม่พบสูตรอาหารสำหรับ "{queryTitle}" ลองปรับเปลี่ยนวัตถุดิบ หรือใช้คำค้นหาที่กว้างขึ้นดูนะ
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

            return (
              <div
                key={`${recipe.id}-${index}`}
                className={`flex flex-col md:flex-row gap-6 p-4 border ${cardBorderClass} rounded-xl bg-white hover:shadow-md transition-shadow relative`}
              >
                {/* ซ้าย: รูปภาพอาหารตัวอย่าง */}
                <div className="w-full md:w-[180px] h-[160px] flex-shrink-0 relative">
                  {/* 🚀 แก้ไขเป็นแท็ก img ธรรมดาตามที่ต้องการ และจัดการขนาดด้วย h-full w-full แทน */}
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover rounded-lg"
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
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gray-50 border border-gray-100 shrink-0">
                      {/* รูป Avatar ก็เป็น img ธรรมดาเช่นกัน */}
                      <img
                        src={recipe.authorAvatar}
                        alt={recipe.author}
                        className="w-full h-full object-cover"
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
                    {/* ยอดกดไลก์หัวใจ */}
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
                    href={`/recipe/${recipe.id}`}
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