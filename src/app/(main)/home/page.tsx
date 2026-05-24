"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar"; // 👈 ดึง Navbar มาใช้แค่ตัวเดียว

// =========================================
// 🍱 ข้อมูลจำลอง (Mock Data)
// =========================================
const categories = [
  { id: 1, emoji: "🥩", name: "Meat & Poultry" },
  { id: 2, emoji: "🍳", name: "Kitchen tools" },
  { id: 3, emoji: "🥗", name: "Fruits" },
  { id: 4, emoji: "🦞", name: "Seafood" },
  { id: 5, emoji: "🥦", name: "Vegetables" },
  { id: 6, emoji: "🥛", name: "Diary & Eggs" },
];

const geminiRecipes = [
  { id: 1, title: "แกงเขียวหวาน", color: "bg-[#3AC9B5]", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80" },
  { id: 2, title: "ไข่เจียวหมูสับ", color: "bg-[#FF8585]", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80" },
  { id: 3, title: "ต้มจืดเต้าหู้", color: "bg-[#6F62E4]", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80" },
];

const chatGptRecipes = [
  { id: 1, title: "ต้มยำกุ้ง", color: "bg-[#F58D38]", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80" },
  { id: 2, title: "ส้มตำไทย", color: "bg-[#D05C5C]", image: "https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&w=600&q=80" },
  { id: 3, title: "ข้าวผัดหมู", color: "bg-[#E6C229]", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F5EFD7] font-sans pb-20 overflow-x-hidden">
      
      {/* 1. NAVBAR (ดึงจาก Component) */}
      <Navbar />

      <main className="w-[95%] max-w-[1440px] mx-auto px-4 mt-12">
        
        {/* =========================================
            2. MY INGREDIENTS SECTION (เพิ่มเข้ามาใหม่)
            ========================================= */}
        <section className="mb-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <h2 className="text-4xl font-extrabold text-black tracking-tight">
              My Ingredients
            </h2>
            <div className="flex items-center gap-4 flex-grow max-w-2xl">
              <div className="relative flex-grow">
                <input 
                  type="text" 
                  placeholder="Search your ingredients..." 
                  className="w-full py-4 px-6 rounded-full bg-white text-gray-700 placeholder-[#A5A5A5] shadow-inner focus:outline-none focus:ring-2 focus:ring-[#71B254] text-lg border border-gray-100"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[#A5A5A5]">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                </div>
              </div>
              <button className="flex-shrink-0 bg-[#71B254] text-white font-bold px-8 py-4 rounded-full shadow-md hover:bg-[#5b9642] transition text-lg flex items-center gap-3">
                <span className="text-2xl">+</span>
                Create Ingredients
              </button>
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
              Your ingredient Categories
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((category) => (
                <div key={category.id} className="bg-white p-6 rounded-[32px] shadow-sm flex items-center gap-6 cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 border border-gray-50">
                  <div className="flex-shrink-0 w-20 h-20 bg-[#F7F7F7] rounded-full flex items-center justify-center shadow-inner">
                    <span className="text-5xl">{category.emoji}</span>
                  </div>
                  <span className="font-bold text-xl text-gray-800 leading-tight">
                    {category.name}
                  </span>
                </div>
              ))}
              <div className="bg-white p-6 rounded-[32px] shadow-sm flex items-center gap-6 cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 border border-gray-50 group">
                <div className="flex-shrink-0 w-20 h-20 bg-[#F0FAF9] rounded-full flex items-center justify-center shadow-inner group-hover:bg-[#E0F5F3] transition">
                  <span className="text-6xl font-light text-[#3AC9B5]">+</span>
                </div>
                <span className="font-bold text-xl text-[#3AC9B5] leading-tight group-hover:text-[#2da898] transition">
                  Add new Category
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            3. DAILY RECOMMENDED MENU SECTION
            ========================================= */}
        <section>
          <h2 className="text-[32px] font-bold text-center mb-20 text-gray-900">
            Daily Recommended Menu
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 xl:gap-12">
            <MenuCarousel provider="By gemini" recipes={geminiRecipes} />
            <MenuCarousel provider="By Chat gpt" recipes={chatGptRecipes} />
          </div>
        </section>

      </main>
    </div>
  );
}

/* =========================================
   COMPONENTS ย่อย (เขียนรวมในไฟล์นี้เลย)
   ========================================= */

function MenuCarousel({ provider, recipes }: { provider: string, recipes: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 3500);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % recipes.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + recipes.length) % recipes.length);

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

function RecipeCard({ bgColor, title, image }: { bgColor: string, title: string, image: string }) {
  return (
    <div className={`${bgColor} w-[280px] rounded-[36px] flex flex-col items-center relative pt-28 pb-10 shadow-lg transition hover:-translate-y-2 overflow-visible`}>
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 h-40 z-20 hover:rotate-6 transition duration-300">
        <img
          src={image} 
          alt={title}
          className="w-full h-full object-cover rounded-full shadow-lg border-[10px] border-[#F4EFE5]" 
        />
      </div>
      <div className="flex items-center justify-center gap-3 mb-5 mt-2 px-4 w-full">
        <span className="font-bold text-2xl text-white whitespace-normal text-center leading-snug max-w-[75%]">
          {title}
        </span>
        <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm shrink-0 cursor-pointer hover:bg-red-50">
          <span className="text-[#FF4747] text-sm">❤</span>
        </div>
      </div>
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