"use client";

import React, { useState, useEffect } from "react";

// =========================================
// 🍱 ข้อมูลจำลอง (Mock Data) อัปเดตชื่อเมนูไทยและรูป
// ========================================
const geminiRecipes = [
  { id: 1, title: "แกงเขียวหวาน", color: "bg-[#6F62E4]", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80" },
  { id: 2, title: "ไข่เจียวหมูสับ", color: "bg-[#FF8585]", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80" },
  { id: 3, title: "ต้มจืดเต้าหู้", color: "bg-[#3AC9B5]", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80" },
  { id: 4, title: "ผัดไทยกุ้งสด", color: "bg-[#63D04C]", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80" },
];

const deepseekRecipes = [
  { id: 1, title: "ต้มยำกุ้ง", color: "bg-[#F58D38]", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80" },
  { id: 2, title: "ส้มตำไทย", color: "bg-[#D05C5C]", image: "https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&w=600&q=80" },
  { id: 3, title: "ข้าวผัดหมู", color: "bg-[#E6C229]", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80" },
  { id: 4, title: "กะเพราไก่ไข่ดาว", color: "bg-[#4285F4]", image: "https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&w=600&q=80" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F5EFD7] font-sans pb-20 overflow-x-hidden">
      {/* =========================================
          1. HEADER & NAVBAR SECTION
          ========================================= */}
      <header className="w-[95%] max-w-[1440px] mx-auto px-4 pt-8 mb-12 flex flex-col xl:flex-row items-center xl:items-start justify-between gap-6">
        <div className="flex-shrink-0 flex items-center justify-center w-32 h-32 xl:w-40 xl:h-40">
          <img src="/photo/logo.png" alt="Kin Yark" className="w-full h-full object-contain" />
        </div>
        <div className="flex-grow w-full max-w-4xl flex flex-col items-center">
          <div className="flex gap-16 mb-5 text-lg font-bold">
            <span className="text-black border-b-[3px] border-black pb-1 cursor-pointer">Home</span>
            <span className="text-[#A5A5A5] hover:text-gray-700 cursor-pointer transition">My Recipe</span>
            <span className="text-[#A5A5A5] hover:text-gray-700 cursor-pointer transition">Favorites</span>
            <span className="text-[#A5A5A5] hover:text-gray-700 cursor-pointer transition">Posts</span>
          </div>
          <div className="w-full relative">
            <input type="text" placeholder="Search ..." className="w-full py-4 px-8 rounded-full bg-white border border-gray-200 text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:border-[#71B254] text-lg" />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-start gap-4 pt-4">
          <button className="px-6 py-3 rounded-full border-2 border-[#71B254] text-[#71B254] font-bold bg-white hover:bg-green-50 transition text-lg">+ Create</button>
          <button className="px-6 py-3 rounded-full bg-[#71B254] text-white font-bold shadow-md hover:bg-[#5b9642] transition flex items-center gap-2 text-lg">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
            Sign in
          </button>
        </div>
      </header>

      {/* =========================================
          2. HERO SECTION
          ========================================= */}
      <main className="w-[95%] max-w-[1440px] mx-auto px-4 grid grid-cols-1 xl:grid-cols-12 gap-12 mb-20">
        <div className="xl:col-span-5 flex flex-col items-center xl:items-start pt-2 pl-4">
          <h2 className="text-[24px] font-bold mb-8 text-gray-900 w-full max-w-[450px] text-center">Ingredient Categories</h2>
          <div className="grid grid-cols-2 gap-5 w-full max-w-[450px]">
            <CategoryCard emoji="🥩" text="Meat & Poultry" />
            <CategoryCard emoji="🍳" text="Kitchen Tools" />
            <CategoryCard emoji="🥗" text="Fruits" />
            <CategoryCard emoji="🦞" text="Seafood" />
            <div className="col-span-2 flex justify-center mt-2">
              <div className="w-[210px]">
                <CategoryCard emoji="🥦" text="Vegetables" />
              </div>
            </div>
          </div>
        </div>
        <div className="xl:col-span-7 flex items-center justify-end relative mt-12 xl:mt-0">
          <div className="bg-white rounded-[40px] w-full xl:w-[88%] p-12 min-h-[300px] shadow-sm flex flex-col justify-center relative">
            <div className="z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#FF8585] text-white rounded-full w-7 h-7 flex items-center justify-center text-sm shadow-sm">✓</div>
                <span className="font-bold text-gray-900 text-xl">Recommended menu</span>
              </div>
              <h1 className="text-6xl font-bold text-[#3AC9B5] mb-5">Salad</h1>
              <div className="flex items-center gap-2 mb-8">
                <span className="text-[#F1C40F] text-2xl">★</span>
                <span className="font-bold text-gray-800 text-lg">5.0</span>
              </div>
              <button className="px-8 py-3 bg-[#71B254] text-white rounded-full font-bold shadow-md hover:bg-[#5b9642] transition flex items-center gap-2 text-base">
                <span>▶</span> View more
              </button>
            </div>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 xl:translate-x-16 w-56 h-56 xl:w-80 xl:h-80 drop-shadow-2xl z-20 pointer-events-none">
             <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80" alt="Salad" className="w-full h-full object-cover rounded-full border-[12px] border-white shadow-xl" />
          </div>
        </div>
      </main>

      {/* =========================================
          3. DAILY RECOMMENDED MENU SECTION
          ========================================= */}
      <section className="w-[95%] max-w-[1440px] mx-auto px-4 mt-12">
        <h2 className="text-[32px] font-bold text-center mb-20 text-gray-900">
          Daily Recommended Menu
        </h2>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 xl:gap-12">
          {/* กล่องหมุนได้ของ Gemini */}
          <MenuCarousel provider="By gemini" recipes={geminiRecipes} />

          {/* กล่องหมุนได้ของ Deep Seek*/}
          <MenuCarousel provider="By Deep Seek" recipes={deepseekRecipes} />
        </div>
      </section>
    </div>
  );
}

/* =========================================
   COMPONENTS ย่อย
   ========================================= */

function MenuCarousel({ provider, recipes }: { provider: string, recipes: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 3500);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % recipes.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + recipes.length) % recipes.length);
  };

  const item1 = recipes[currentIndex];
  const item2 = recipes[(currentIndex + 1) % recipes.length];

  return (
    <div className="bg-white rounded-[40px] p-10 pb-6 relative shadow-sm mx-auto w-full max-w-[650px]">
      <ArrowButton direction="left" onClick={handlePrev} />
      <ArrowButton direction="right" onClick={handleNext} />
      
      <div className="flex justify-center gap-6 mt-12 px-4 relative">
        <div key={`card1-${item1.id}`} className="animate-fade-in relative">
          <RecipeCard title={item1.title} bgColor={item1.color} image={item1.image} />
        </div>
        <div key={`card2-${item2.id}`} className="animate-fade-in relative">
          <RecipeCard title={item2.title} bgColor={item2.color} image={item2.image} />
        </div>
      </div>
      
      <div className="text-right text-[#A5A5A5] text-base font-medium mt-6 mr-2">
        {provider}
      </div>
    </div>
  );
}

function CategoryCard({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="bg-white px-5 py-4 rounded-[24px] shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition">
      <div className="text-3xl">{emoji}</div>
      <span className="font-bold text-base text-gray-800">{text}</span>
    </div>
  );
}

function ArrowButton({ direction, onClick }: { direction: "left" | "right", onClick: () => void }) {
  const isLeft = direction === "left";
  return (
    <button
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-[0_3px_15px_rgb(0,0,0,0.1)] flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:scale-110 active:scale-95 transition-all z-20 ${
        isLeft ? "-left-7" : "-right-7"
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

// 🌟 อัปเดตล่าสุด: การ์ดยาวขึ้น ขยายรูป และแก้ปัญหาข้อความทับปุ่มหัวใจ
function RecipeCard({ bgColor, title, image }: { bgColor: string, title: string, image: string }) {
  return (
    <div className={`${bgColor} w-[280px] rounded-[36px] flex flex-col items-center relative pt-28 pb-10 shadow-lg transition hover:-translate-y-2 overflow-visible`}>
      
      {/* 1. ขยายรูปภาพให้ใหญ่ขึ้น (w-40 h-40) และดันขึ้นให้พ้นการ์ด (-top-16) */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 h-40 z-20 hover:rotate-6 transition duration-300">
        <img
          src={image} 
          alt={title}
          className="w-full h-full object-cover rounded-full shadow-lg border-[10px] border-[#F4EFE5]" 
        />
      </div>

      {/* 2. จัดการระยะห่างและบีบความกว้างข้อความ (max-w-[75%]) ไม่ให้ไปชนหัวใจ */}
      <div className="flex items-center justify-center gap-3 mb-5 mt-2 px-4 w-full">
        <span className="font-bold text-2xl text-white whitespace-normal text-center leading-snug max-w-[75%]">
          {title}
        </span>
        <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm shrink-0 cursor-pointer hover:bg-red-50">
          <span className="text-[#FF4747] text-sm">❤</span>
        </div>
      </div>

      {/* 3. ดันดาวกับปุ่มให้มีช่องไฟกำลังดี */}
      <div className="flex items-center gap-2 mb-8">
        <span className="text-[#F1C40F] text-xl">★</span>
        <span className="font-semibold text-white text-lg">5.0</span>
      </div>

      <button className="bg-white text-gray-800 text-sm font-bold px-8 py-3.5 rounded-full shadow-sm hover:bg-gray-100 transition flex items-center gap-2.5">
        <span>▶</span> View more
      </button>
    </div>
  );
}