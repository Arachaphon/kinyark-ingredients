"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import useSWR from "swr";
import CookieConsent from "@/components/CookieConsent";
import Link from "next/link";
import { Anuphan } from "next/font/google";

// 🌟 เรียกใช้งานฟอนต์ Anuphan จาก Google Fonts
const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

// 🌟 เมนูจำลอง (Mock Data) จัดเต็มค่ายละ 4 เมนู สีสันสดใสชวนหิว
interface RecommendedRecipe {
  id: string;
  menu_name: string;
  bg_color?: string;
  featured_image_url?: string;
  rating?: number;
}

interface WeeklyRecipeItem {
  id: string;
  type: "seasonal" | "trending";
  recipeName: string;
  rating: number;
  favoriteCount: number;
  createdAt: string;
  bgColor: string | null;
  visibility: string;
  imageUrl: string | null;
}

interface WeeklyResponse {
  success: boolean;
  weekKey: string;
  generated: boolean;
  missingProviders?: string[];
  recipes: WeeklyRecipeItem[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const fallbackGemini: RecommendedRecipe[] = [
  {
    id: "mock-g1",
    menu_name: "ข้าวผัดต้มยำกุ้งแห้ง",
    bg_color: "bg-[#6F62E4]",
    featured_image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
    rating: 4.9
  },
  {
    id: "mock-g2",
    menu_name: "สเต็กไก่พริกไทยดำ",
    bg_color: "bg-[#E67E22]",
    featured_image_url: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d",
    rating: 4.8
  },
  {
    id: "mock-g3",
    menu_name: "แกงเขียวหวานไก่โรตี",
    bg_color: "bg-[#27AE60]",
    featured_image_url: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd",
    rating: 4.7
  },
  {
    id: "mock-g4",
    menu_name: "ผัดไทยกุ้งสดห่อไข่",
    bg_color: "bg-[#D35400]",
    featured_image_url: "https://images.unsplash.com/photo-1626804475315-9644b37a2fe4",
    rating: 5.0
  }
];

const fallbackDeepseek: RecommendedRecipe[] = [
  {
    id: "mock-d1",
    menu_name: "สปาเก็ตตี้คาโบนาร่า",
    bg_color: "bg-[#3AC9B5]",
    featured_image_url: "https://images.unsplash.com/photo-1612874742237-6526221588e3",
    rating: 5.0
  },
  {
    id: "mock-d2",
    menu_name: "แซลมอนย่างซีอิ๊ว",
    bg_color: "bg-[#E74C3C]",
    featured_image_url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2",
    rating: 4.7
  },
  {
    id: "mock-d3",
    menu_name: "ซูชิแซลมอนเซ็ตโปร",
    bg_color: "bg-[#2C3E50]",
    featured_image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c",
    rating: 4.9
  },
  {
    id: "mock-d4",
    menu_name: "พิซซ่าเตาถ่านฮาวายเอี้ยน",
    bg_color: "bg-[#F39C12]",
    featured_image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591",
    rating: 4.6
  }
];

// ข้อมูลจำลองสำหรับสูตรอาหารแนะนำด้านบนสุด
const mockFeatured = {
  id: "featured-1",
  recipeName: "สลัดผลไม้ออร์แกนิก",
  rating: 5.0,
  imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80"
};

export default function HomePage() {
  const { data: weeklyData } = useSWR<WeeklyResponse>("/api/weekly-recommendations", fetcher);

  // แปลงเมนูที่ AI สร้างให้เป็นรูปแบบที่ MenuCarousel ใช้
  const toDisplay = (items: WeeklyRecipeItem[] | undefined): RecommendedRecipe[] =>
    (items ?? []).map((r) => ({
      id: r.id,
      menu_name: r.recipeName,
      bg_color: r.bgColor ?? undefined,
      featured_image_url: r.imageUrl ?? undefined,
      rating: r.rating,
    }));

  // แยกตามประเภท: seasonal (Gemini) + trending (Groq) ที่ AI สร้างเอง
  const seasonal = toDisplay(weeklyData?.recipes?.filter((r) => r.type === "seasonal"));
  const trending = toDisplay(weeklyData?.recipes?.filter((r) => r.type === "trending"));

  const geminiToDisplay = seasonal.length > 0 ? seasonal : fallbackGemini;
  const deepseekToDisplay = trending.length > 0 ? trending : fallbackDeepseek;
  const featured = mockFeatured;

  return (
    <div className={`min-h-screen bg-[#F5EFD7] pb-20 overflow-x-hidden ${anuphan.className}`}>
      
      {/* =========================================
          1. HEADER & NAVBAR SECTION (Responsive)
          ========================================= */}
      <header className="w-[95%] max-w-[1440px] mx-auto px-4 pt-6 mb-8 lg:mb-12 flex flex-col xl:flex-row items-center justify-between gap-6">
        
        {/* โลโก้ */}
        <div className="flex-shrink-0 flex items-center justify-center w-36 h-36 sm:w-48 sm:h-48 xl:w-64 xl:h-64 relative">
          <Image src="/photo/logo.png" alt="Kin Yark" fill className="object-contain" priority />
        </div>

        {/* ส่วนค้นหาและลิงก์เมนูตรงกลาง */}
        <div className="flex-grow w-full max-w-4xl flex flex-col items-center">
          <div className="flex flex-wrap justify-center gap-6 sm:gap-12 mb-4 text-base sm:text-lg font-bold">
            <span className="text-black border-b-[3px] border-black pb-1 cursor-pointer">หน้าแรก</span>

          </div>
          <div className="w-full relative">
            <input type="text" placeholder="ค้นหา..." className="w-full py-3 sm:py-4 px-6 sm:px-8 rounded-full bg-white border border-gray-200 text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:border-[#71B254] text-base sm:text-lg" />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
            </div>
          </div>
        </div>

        {/* ปุ่มฝั่งขวา */}
        <div className="flex-shrink-0 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Link href="/login" className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#71B254] text-white font-bold shadow-md hover:bg-[#5b9642] transition flex items-center gap-2 text-base sm:text-lg">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
            เข้าสู่ระบบ
          </Link>
        </div>
      </header>

      {/* =========================================
          2. HERO SECTION (Responsive Grid)
          ========================================= */}
      <main className="w-[95%] max-w-[1440px] mx-auto px-4 grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-12 mb-16 xl:mb-20">
        
        {/* หมวดหมู่วัตถุดิบ */}
        <div className="xl:col-span-5 flex flex-col items-center xl:items-start pt-2">
          <h2 className="text-xl sm:text-[24px] font-bold mb-6 text-gray-900 w-full max-w-[450px] text-center xl:text-left">หมวดหมู่วัตถุดิบ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[450px]">
            <CategoryCard emoji="🥩" text="เนื้อสัตว์" />
            <CategoryCard emoji="🍳" text="อุปกรณ์ทำครัว" />
            <CategoryCard emoji="🥗" text="ผลไม้" />
            <CategoryCard emoji="🦞" text="อาหารทะเล" />
            <CategoryCard emoji="🥦" text="ผัก" />
            <CategoryCard emoji="🍚" text="ข้าว เส้นและแป้ง" />
            <CategoryCard emoji="🥚" text="ไข่และผลิตภัณฑ์จากนม" />
            <CategoryCard emoji="🧂" text="เครื่องปรุงและซอส" />
            <CategoryCard emoji="🌿" text="เครื่องเทศและสมุนไพร" />
            <CategoryCard emoji="🥜" text="ถั่วและเมล็ดพืช" />
            <CategoryCard emoji="🧈" text="น้ำมันและไขมัน" />
            <CategoryCard emoji="🥤" text="ของเหลวและเครื่องดื่ม" />
            <div className="sm:col-span-2 flex justify-center mt-1">
              <div className="w-full sm:w-[210px]">
                <CategoryCard emoji="📦" text="อื่นๆ" />
              </div>
            </div>
          </div>
        </div>

        {/* การ์ดสูตรอาหารแนะนำหลัก */}
        <div className="xl:col-span-7 flex items-center justify-center xl:justify-end relative mt-8 xl:mt-0">
<<<<<<< HEAD
          <div className="bg-white rounded-[30px] sm:rounded-[40px] w-full xl:w-[88%] p-6 sm:p-12 pb-24 sm:pb-12 xl:pb-12 min-h-[280px] shadow-sm flex flex-col justify-center relative">
            
            {/* กล่องใส่ข้อความ ล็อกความกว้างเพื่อหลบรูปวงกลม */}
            <div className="z-10 w-full max-w-[calc(100%-110px)] sm:max-w-[calc(100%-200px)] xl:max-w-[calc(100%-280px)]">
=======
          {/* ปรับแก้: เพิ่ม padding-right ฝั่งขวา กันไม่ให้ตัวหนังสือไหลไปทับรูป */}
          <div className="bg-white rounded-[30px] sm:rounded-[40px] w-full xl:w-[92%] p-6 sm:p-12 pr-36 sm:pr-60 xl:pr-72 pb-12 min-h-[280px] shadow-sm flex flex-col justify-center relative">
            <div className="z-10 max-w-full">
>>>>>>> 45a9cfeb132f21a0f65d37fca8f353c86ca527f0
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="bg-[#FF8585] text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-xs sm:text-sm shadow-sm font-bold">✓</div>
                <span className="font-bold text-gray-900 text-lg sm:text-xl">สูตรอาหารแนะนำ</span>
              </div>
              
<<<<<<< HEAD
              <h1 
                className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold text-[#3AC9B5] mb-4 sm:mb-5 leading-tight line-clamp-2"
                title={featured.recipeName}
              >
                {featured.recipeName}
              </h1>
              
=======
              {/* ปรับแก้: บังคับความกว้างสูงสุด ให้ตัดขึ้นบรรทัดใหม่อย่างเป็นระเบียบ */}
              <h1 className="text-xl sm:text-2xl md:text-3xl xl:text-4xl font-bold text-[#3AC9B5] mb-4 sm:mb-5 break-words leading-tight max-w-full xl:max-w-[75%]">
                {featured.recipeName}
              </h1>
>>>>>>> 45a9cfeb132f21a0f65d37fca8f353c86ca527f0
              <div className="flex items-center gap-2 mb-6 sm:mb-8">
                <span className="text-[#F1C40F] text-xl sm:text-2xl">★</span>
                <span className="font-bold text-gray-800 text-base sm:text-lg">{featured.rating.toFixed(1)}</span>
              </div>
              
              <Link href={`/recipe/${featured.id}`} className="inline-flex px-6 sm:px-8 py-2.5 sm:py-3 bg-[#71B254] text-white rounded-full font-bold shadow-md hover:bg-[#5b9642] transition items-center gap-2 text-sm sm:text-base">
                <span>▶</span> ดูเพิ่มเติม
              </Link>
            </div>
          </div>

          {/* ปรับแก้: ปรับตำแหน่งให้อยู่ในขอบเขตการ์ด ไม่ล้นจนโดน overflow-x-hidden ตัดขอบแหว่ง */}
          <div className="absolute right-2 sm:right-4 xl:-right-6 top-1/2 -translate-y-1/2 w-32 h-32 sm:w-52 sm:h-52 xl:w-72 xl:h-72 drop-shadow-2xl z-20 pointer-events-none">
            <Image 
              src={featured.imageUrl} 
              alt={featured.recipeName} 
              fill 
              className="object-cover rounded-full border-[8px] sm:border-[12px] border-white shadow-xl" 
              sizes="(max-width: 640px) 128px, (max-width: 1280px) 208px, 288px" 
              priority 
            />
          </div>
        </div>
      </main>

      {/* =========================================
          3. DAILY RECOMMENDED MENU SECTION
          ========================================= */}
      <section className="w-[95%] max-w-[1440px] mx-auto px-4 mt-12">
        <h2 className="text-2xl sm:text-[32px] font-bold text-center mb-12 sm:mb-20 text-gray-900">
          สูตรแนะนำประจำสัปดาห์
        </h2>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 xl:gap-12">
          <MenuCarousel provider="โดย Gemini" recipes={geminiToDisplay} />
          <MenuCarousel provider="โดย Groq" recipes={deepseekToDisplay} />
        </div>
      </section>

      <CookieConsent />
    </div>
  );
}

/* =========================================
    COMPONENTS ย่อยที่ปรับให้ Responsive แล้ว
   ========================================= */

function MenuCarousel({ provider, recipes }: { provider: string, recipes: RecommendedRecipe[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (recipes.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % recipes.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [recipes.length]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % recipes.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + recipes.length) % recipes.length);
  };

  const item1 = recipes[currentIndex];
  const item2 = recipes[(currentIndex + 1) % recipes.length] || item1;

  return (
    <div className={`bg-white rounded-[30px] sm:rounded-[40px] p-4 sm:p-10 pb-6 relative shadow-sm mx-auto w-full max-w-[650px] ${anuphan.className}`}>
      <ArrowButton direction="left" onClick={handlePrev} />
      <ArrowButton direction="right" onClick={handleNext} />

      {/* บนมือถือจอเล็กให้เรียงแนวตั้งหรือยืดหยุ่นไม่ให้ล้น */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-20 sm:gap-6 mt-16 sm:mt-12 px-2 sm:px-4 relative">
        <div key={`card1-${item1.id}`} className="animate-fade-in relative w-full sm:w-auto flex justify-center">
          <RecipeCard
            id={item1.id}
            title={item1.menu_name}
            bgColor={item1.bg_color || "bg-[#6F62E4]"}
            image={item1.featured_image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"}
            rating={item1.rating}
          />
        </div>
        <div key={`card2-${item2.id}`} className="animate-fade-in relative w-full sm:w-auto flex justify-center">
          <RecipeCard
            id={item2.id}
            title={item2.menu_name}
            bgColor={item2.bg_color || "bg-[#3AC9B5]"}
            image={item2.featured_image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"}
            rating={item2.rating}
          />
        </div>
      </div>
      
      <div className="text-right text-[#A5A5A5] text-sm sm:text-base font-bold mt-6 mr-2">
        {provider}
      </div>
    </div>
  );
}

function CategoryCard({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className={`bg-white px-4 sm:px-5 py-3 sm:py-4 rounded-[20px] sm:rounded-[24px] shadow-sm flex items-center gap-3 sm:gap-4 cursor-pointer hover:shadow-md transition ${anuphan.className}`}>
      <div className="text-2xl sm:text-3xl">{emoji}</div>
      <span className="font-bold text-sm sm:text-base text-gray-800">{text}</span>
    </div>
  );
}

function ArrowButton({ direction, onClick }: { direction: "left" | "right", onClick: () => void }) {
  const isLeft = direction === "left";
  return (
    <button
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 w-10 h-10 sm:w-14 sm:h-14 bg-white rounded-full shadow-[0_3px_15px_rgba(0,0,0,0.1)] flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:scale-110 active:scale-95 transition-all z-20 ${
        isLeft ? "-left-2 sm:-left-7" : "-right-2 sm:-right-7"
      }`}
    >
      {isLeft ? (
        <svg width="22" height="22" className="sm:w-7 sm:h-7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
      ) : (
        <svg width="22" height="22" className="sm:w-7 sm:h-7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
      )}
    </button>
  );
}

function RecipeCard({ id, bgColor, title, image, rating }: { id: string, bgColor: string, title: string, image: string, rating?: number }) {
  return (
    <div className={`${bgColor} w-[240px] sm:w-[280px] rounded-[36px] flex flex-col items-center relative pt-24 pb-6 shadow-lg transition hover:-translate-y-2 overflow-visible ${anuphan.className}`}>
      
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-36 h-36 sm:w-40 sm:h-40 z-20 hover:rotate-6 transition duration-300">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover rounded-full shadow-lg border-[8px] sm:border-[10px] border-[#F4EFE5]"
          sizes="160px"
        />
      </div>

      <div className="relative w-full mb-5 mt-2 px-8 sm:px-10 flex items-center justify-center min-h-[64px]">
        <span className="font-bold text-lg sm:text-2xl text-white text-center leading-snug block w-full line-clamp-2" title={title}>
          {title}
        </span>

        <div className="absolute right-3 sm:right-4 bg-white rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shadow-sm shrink-0 cursor-pointer hover:bg-red-50">
          <span className="text-[#FF4747] text-xs sm:text-sm">❤</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-8">
        <span className="text-[#F1C40F] text-lg sm:text-xl">★</span>
        <span className="font-bold text-white text-base sm:text-lg">
          {rating ? rating.toFixed(1) : "5.0"}
        </span>
      </div>

      <Link href={`/recipe/${id}`} className="bg-white text-gray-800 text-xs sm:text-sm font-bold px-6 sm:px-8 py-3 sm:py-3.5 rounded-full shadow-sm hover:bg-gray-100 transition flex items-center gap-2">
        <span>▶</span> ดูเพิ่มเติม
      </Link>
    </div>
  );
}