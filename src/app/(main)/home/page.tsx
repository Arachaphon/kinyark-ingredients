"use client";

import Image from "next/image";
import React, { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import Navbar from "@/components/Navbar"; 
import Link from "next/link"; 
import { Anuphan } from "next/font/google";

const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

// =========================================
// 🍱 Type Interface อิงตาม Prisma Schema
// ========================================
interface RecipeData {
  id: string | number; 
  recipeName: string;
  bgColor: string | null;
  rating: number;
  images: { id: string; imageUrl: string }[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// =========================================
// 🎨 ข้อมูลจำลอง (Mock Data) ใช้ขัดตาทัพระหว่างรอ API
// ========================================
const mockFeaturedRecipe: RecipeData = {
  id: "mock-featured",
  recipeName: "สลัด",
  bgColor: null,
  rating: 5.0,
  images: [{ id: "img-1", imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80" }]
};

const mockGeminiRecipes: RecipeData[] = [
  { id: "g1", recipeName: "แกงเขียวหวาน", bgColor: "bg-[#6F62E4]", rating: 5, images: [{ id: "i1", imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80" }] },
  { id: "g2", recipeName: "ไข่เจียวหมูสับ", bgColor: "bg-[#FF8585]", rating: 4.5, images: [{ id: "i2", imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80" }] },
  { id: "g3", recipeName: "ต้มจืดเต้าหู้", bgColor: "bg-[#3AC9B5]", rating: 4.8, images: [{ id: "i3", imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80" }] },
  { id: "g4", recipeName: "ผัดไทยกุ้งสด", bgColor: "bg-[#63D04C]", rating: 5, images: [{ id: "i4", imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80" }] },
];

const mockDeepseekRecipes: RecipeData[] = [
  { id: "d1", recipeName: "ต้มยำกุ้ง", bgColor: "bg-[#F58D38]", rating: 5, images: [{ id: "i5", imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80" }] },
  { id: "d2", recipeName: "ส้มตำไทย", bgColor: "bg-[#D05C5C]", rating: 4.9, images: [{ id: "i6", imageUrl: "https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&w=600&q=80" }] },
  { id: "d3", recipeName: "ข้าวผัดหมู", bgColor: "bg-[#E6C229]", rating: 4.7, images: [{ id: "i7", imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80" }] },
  { id: "d4", recipeName: "กะเพราไก่ไข่ดาว", bgColor: "bg-[#4285F4]", rating: 5, images: [{ id: "i8", imageUrl: "https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&w=600&q=80" }] },
];

export default function HomePage() {
  const { data: featuredData } = useSWR("/api/recipes/featured", fetcher);
  
  const isApiReady = featuredData?.data && featuredData.data.length > 0;
  const featured: RecipeData = isApiReady ? featuredData.data[0] : mockFeaturedRecipe;

  return (
    <div className={`min-h-screen bg-[#F5EFD7] pb-20 overflow-x-hidden ${anuphan.className}`}>
      <Navbar />

      <main className="w-[95%] max-w-[1440px] mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-12 mb-20 mt-8">
        <div className="md:col-span-5 flex flex-col items-center md:items-start pt-2 pl-4">
          <h2 className="text-[24px] font-bold mb-8 text-gray-900 w-full max-w-[450px] text-center">หมวดหมู่วัตถุดิบ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-[450px]">
            <CategoryCard emoji="🥩" text="เนื้อสัตว์" category="Meat" />
            <CategoryCard emoji="🍳" text="อุปกรณ์ทำครัว" category="Kitchen Tools" />
            <CategoryCard emoji="🥗" text="ผลไม้" category="Fruits" />
            <CategoryCard emoji="🦞" text="อาหารทะเล" category="Seafood" />
            <CategoryCard emoji="🥦" text="ผัก" category="Vegetables" />
            <CategoryCard emoji="🍚" text="ข้าว เส้นและแป้ง" category="Grains, Pasta & Baking" />
            <CategoryCard emoji="🥚" text="ไข่และผลิตภัณฑ์จากนม" category="Dairy & Eggs" />
            <CategoryCard emoji="🧂" text="เครื่องปรุงและซอส" category="Condiments & Sauces" />
            <CategoryCard emoji="🌿" text="เครื่องเทศและสมุนไพร" category="Spices & Herbs" />
            <CategoryCard emoji="🥜" text="ถั่วและเมล็ดพืช" category="Nuts & Seeds" />
            <CategoryCard emoji="🧈" text="น้ำมันและไขมัน" category="Fats & Oils" />
            <CategoryCard emoji="🥤" text="ของเหลวและเครื่องดื่ม" category="Liquids & Beverages" />
            <div className="sm:col-span-2 flex justify-center mt-2 w-full">
              <div className="w-full sm:w-[210px]">
                <CategoryCard emoji="📦" text="อื่นๆ" category="Others" />
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-7 flex items-center justify-end relative mt-12 md:mt-0">
          <div className="bg-white rounded-[40px] w-full md:w-[88%] p-12 pr-36 md:pr-12 min-h-[300px] shadow-sm flex flex-col justify-center relative">
            <div className="z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#FF8585] text-white rounded-full w-7 h-7 flex items-center justify-center text-sm shadow-sm">✓</div>
                <span className="font-bold text-gray-900 text-xl">สูตรอาหารแนะนำ</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-[#3AC9B5] mb-5 break-words leading-tight">{featured.recipeName}</h1>
              <div className="flex items-center gap-2 mb-8">
                <span className="text-[#F1C40F] text-2xl">★</span>
                <span className="font-bold text-gray-800 text-lg">{featured.rating.toFixed(1)}</span>
              </div>

              <Link
                href={`/recipe/${featured.id}`}
                className="px-8 py-3 bg-[#71B254] text-white rounded-full font-bold shadow-md hover:bg-[#5b9642] transition flex items-center gap-2 text-base w-fit block text-center shadow-sm"
              >
                <span>▶</span> ดูเพิ่มเติม
              </Link>
            </div>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 md:translate-x-16 w-40 h-40 md:w-80 md:h-80 drop-shadow-2xl z-20 pointer-events-none">
              <Image src={featured.images?.[0]?.imageUrl || mockFeaturedRecipe.images[0].imageUrl} alt={featured.recipeName} fill className="object-cover rounded-full border-[6px] md:border-[12px] border-white shadow-xl" sizes="(max-width: 768px) 160px, 320px" />
          </div>
        </div>
      </main>

      <section className="w-[95%] max-w-[1440px] mx-auto px-4 mt-12">
        <h2 className="text-[32px] font-bold text-center mb-20 text-gray-900">
          สูตรอาหารแนะนำประจำสัปดาห์
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12">
          <MenuCarousel 
            provider="โดย gemini" 
            apiEndpoint="/api/recipes?aiProvider=gemini" 
            fallbackMockData={mockGeminiRecipes}
          />
          <MenuCarousel 
            provider="โดย Deepseek" 
            apiEndpoint="/api/recipes?aiProvider=deepseek" 
            fallbackMockData={mockDeepseekRecipes}
          />
        </div>
      </section>
    </div>
  );
}

function CategoryCard({ emoji, text, category }: { emoji: string; text: string; category: string }) {
  return (
    <Link 
      href={`/search?category=${encodeURIComponent(category)}`}
      className="bg-white px-5 py-4 rounded-[24px] shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-b-2 border-transparent active:translate-y-0 block"
    >
      <div className="text-3xl select-none">{emoji}</div>
      <span className="font-bold text-base text-gray-800">{text}</span>
    </Link>
  );
}

function MenuCarousel({ 
  provider, 
  apiEndpoint,
  fallbackMockData
}: {
  provider: string; 
  apiEndpoint: string;
  fallbackMockData: RecipeData[];
} ) {
  const [recipes, setRecipes] = useState<RecipeData[]>(fallbackMockData);
  const [isUsingMock, setIsUsingMock] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!hasMore) return;
    const fetchRecipes = async () => {
      try {
        const res = await fetch(`${apiEndpoint}&page=${page}&limit=4`);
        if (!res.ok) return;
        const json = await res.json();
        const newRecipes = json.data || [];
        
        if (newRecipes.length > 0) {
          setRecipes((prev) => {
            if (isUsingMock) return newRecipes; 
            const existingIds = new Set(prev.map(r => r.id));
            const uniqueNew = newRecipes.filter((r: RecipeData) => !existingIds.has(r.id));
            return [...prev, ...uniqueNew];
          });
          setIsUsingMock(false);
        } else if (!isUsingMock) {
          setHasMore(false);
        }
      } catch (error) {
        console.error("API Fetch Error (Using Mock Data Instead):", error);
      }
    };
    fetchRecipes();
  }, [apiEndpoint, page, hasMore, isUsingMock]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (hasMore && !isUsingMock && nextIndex >= recipes.length - 2) {
        setPage((prevPage) => prevPage + 1);
      }
      return recipes.length > 0 ? nextIndex % recipes.length : 0;
    });
  }, [recipes.length, hasMore, isUsingMock]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prevIndex) => recipes.length > 0 ? (prevIndex - 1 + recipes.length) % recipes.length : 0);
  }, [recipes.length]);

  useEffect(() => {
    if (recipes.length === 0) return;
    const timer = setInterval(() => handleNext(), 3500);
    return () => clearInterval(timer);
  }, [handleNext, recipes.length]);

  const item1 = recipes[currentIndex];
  const item2 = recipes[(currentIndex + 1) % recipes.length];

  return (
    <div className="bg-white rounded-[40px] p-6 sm:p-10 pb-6 relative shadow-sm mx-auto w-full max-w-[340px] sm:max-w-[650px]">
      <ArrowButton direction="left" onClick={handlePrev} />
      <ArrowButton direction="right" onClick={handleNext} />
      
      <div className="flex flex-col sm:flex-row justify-center items-center gap-24 sm:gap-6 mt-20 sm:mt-12 px-4 relative">
        {item1 && (
          <div key={`card1-${item1.id}`} className="animate-fade-in relative flex-1 flex justify-center">
            <RecipeCard 
              id={item1.id} 
              title={item1.recipeName} 
              bgColor={item1.bgColor} 
              image={item1.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80"} 
              rating={item1.rating}
            />
          </div>
        )}
        {item2 && (
          <div key={`card2-${item2.id}`} className="animate-fade-in relative flex-1 flex justify-center">
            <RecipeCard 
              id={item2.id} 
              title={item2.recipeName} 
              bgColor={item2.bgColor} 
              image={item2.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80"} 
              rating={item2.rating}
            />
          </div>
        )}
      </div>
      
      <div className="text-right text-[#A5A5A5] text-base font-medium mt-6 mr-2">
        {provider}
      </div>
    </div>
  );
}

function ArrowButton({ direction, onClick }: { direction: "left" | "right", onClick: () => void }) {
  const isLeft = direction === "left";
  return (
    <button
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-[0_3px_15px_rgb(0,0,0,0.1)] flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:scale-110 active:scale-95 transition-all z-20 ${
        isLeft ? "left-1 sm:-left-7" : "right-1 sm:-right-7"
      }`}
    >
      {isLeft ? (
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
      ) : (
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
      )}
    </button>
  );
}

// 🎨 ตะกร้าเก็บสีทั้งหมดที่ระบบอนุญาต (บังคับให้ Tailwind รู้จักสีพวกนี้ทั้งหมด)
const SAFE_BG_CLASSES = [
  "bg-[#6F62E4]", // ม่วง
  "bg-[#FF8585]", // ชมพู/แดงอ่อน
  "bg-[#3AC9B5]", // มิ้นท์
  "bg-[#63D04C]", // เขียวสด
  "bg-[#F58D38]", // ส้ม
  "bg-[#D05C5C]", // แดงเข้ม
  "bg-[#E6C229]", // เหลือง
  "bg-[#4285F4]"  // ฟ้า
];

// 🌟 ปรับปรุง RecipeCard: บังคับความสูงเท่ากันเป๊ะ (Fixed Height = 340px)
function RecipeCard({ 
  id, 
  bgColor, 
  title, 
  image, 
  rating,
  initialIsFavorite = false 
}: { 
  id: string | number, 
  bgColor: string | null, 
  title: string, 
  image: string, 
  rating: number,
  initialIsFavorite?: boolean 
}) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);

  const getValidBgClass = () => {
    if (bgColor && SAFE_BG_CLASSES.includes(bgColor)) return bgColor;
    if (bgColor && bgColor.startsWith("#")) {
      const formatted = `bg-[${bgColor}]`;
      if (SAFE_BG_CLASSES.includes(formatted)) return formatted;
    }
    const charCodeSum = String(id).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return SAFE_BG_CLASSES[charCodeSum % SAFE_BG_CLASSES.length];
  };

  const cardBgClass = getValidBgClass();

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const revert = () => setIsFavorite((prev) => !prev);

    // 1. Optimistic UI: สลับทันที
    setIsFavorite((prev) => !prev);

    // 2. ยิง API; ถ้า server ปฏิเสธให้ revert กลับเพื่อซิงค์เสมอ
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
    <div 
      // ⚠️ เพิ่ม h-[340px] บังคับความสูงตายตัว และ justify-between เพื่อกระจายช่องว่างให้เท่ากัน
      className={`${cardBgClass} w-full max-w-[280px] sm:w-[280px] h-[340px] rounded-[36px] flex flex-col items-center justify-between relative pt-28 pb-8 shadow-lg transition hover:-translate-y-2 overflow-visible`}
    >
      
      {/* ส่วนรูปภาพ */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 h-40 z-20 hover:rotate-6 transition duration-300">
        <Image src={image} alt={title} fill className="object-cover rounded-full shadow-lg border-[10px] border-white" sizes="160px" />
      </div>

      {/* ส่วนเนื้อหา ชื่อ + ดาวเรตติ้ง (จับรวมกลุ่มกัน) */}
      <div className="flex flex-col items-center w-full px-4">
        
        {/* ⚠️ min-h-[64px] ล็อคความสูงของกรอบชื่ออาหาร ให้กินพื้นที่ 2 บรรทัดเสมอ (ป้องกันการ์ดหดตัว) */}
        <div className="flex items-center justify-center gap-3 w-full relative z-30 min-h-[64px] mb-3">
          <span className="font-bold text-2xl text-white whitespace-normal text-center leading-snug max-w-[75%] line-clamp-2">
            {title}
          </span>
          
          <div 
            onClick={toggleFavorite}
            className="bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm shrink-0 cursor-pointer hover:bg-red-50 transition-all active:scale-90 relative z-50"
          >
            {isFavorite ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#FF4747" stroke="#FF4747" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-fade-in pointer-events-none transition-all duration-300 scale-110">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A5A5A5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="hover:stroke-[#FF4747] transition-all duration-300 pointer-events-none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            )}
          </div>
        </div>

        {/* ดาว */}
        <div className="flex items-center gap-2 relative z-30">
          <span className="text-[#F1C40F] text-xl">★</span>
          <span className="font-semibold text-white text-lg">{rating ? rating.toFixed(1) : "5.0"}</span>
        </div>
      </div>

      {/* ปุ่มกด (จะถูกดันลงมาอยู่ล่างสุดเสมอเพราะใส่ justify-between ไว้) */}
      <Link 
        href={`/recipe/${id}`}
        className="bg-white text-gray-800 text-sm font-bold px-8 py-3.5 rounded-full shadow-sm hover:bg-gray-100 transition flex items-center gap-2.5 relative z-30 block text-center"
      >
        <span>▶</span> ดูเพิ่มเติม
      </Link>
    </div>
  );
}