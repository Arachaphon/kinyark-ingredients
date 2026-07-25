"use client";

import React, { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import { useSearchParams, useRouter } from "next/navigation";
import { Anuphan } from "next/font/google";

const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

// Mock Data วัตถุดิบ (สามารถเปลี่ยนเป็น Fetch จาก API `/api/categories` ได้ในอนาคต)
const categoriesData = [
  {
    id: "Meat",
    name: "เนื้อสัตว์",
    emoji: "🥩",
    ingredients: ["ไก่", "หมู", "เนื้อวัว", "เนื้อแกะ", "เป็ด", "สามชั้น"]
  },
  {
    id: "Fruits",
    name: "ผลไม้",
    emoji: "🥗",
    ingredients: ["แอปเปิ้ล", "กล้วย", "ส้ม", "สตรอว์เบอร์รี", "มะนาวเขียว", "อะโวคาโด"]
  },
  {
    id: "Seafood",
    name: "อาหารทะเล",
    emoji: "🦞",
    ingredients: ["กุ้ง", "ปู", "แซลมอน", "ปลาหมึก", "หอยแมลงภู่"]
  },
  {
    id: "Vegetables",
    name: "ผัก",
    emoji: "🥦",
    ingredients: ["มะเขือเทศ", "หัวหอม", "กระเทียม", "แครอท", "มันฝรั่ง", "พริก"]
  }
];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const categoryParam = searchParams.get("category") || "Meat";

  const [activeCategory, setActiveCategory] = useState(categoryParam);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(["ไก่"]);
  const [ingSearchTerm, setIngSearchTerm] = useState("");
  
  // 🤖 เพิ่ม State สำหรับเลือก AI Provider (อิงตาม schema: aiProvider ใน Recipe)
  const [aiProvider, setAiProvider] = useState<"gemini" | "deepseek">("gemini");

  useEffect(() => {
    if (searchParams.get("category")) {
      setActiveCategory(searchParams.get("category")!);
      setIngSearchTerm("");
    }
  }, [searchParams]);

  const handleCheckboxChange = (ingredient: string) => {
    if (selectedIngredients.includes(ingredient)) {
      setSelectedIngredients(selectedIngredients.filter((item) => item !== ingredient));
    } else {
      setSelectedIngredients([...selectedIngredients, ingredient]);
    }
  };

  // 🚀 ฟังก์ชันรวบรวมข้อมูลแล้วส่งต่อไปหน้า Results
  const handleSearch = () => {
    const params = new URLSearchParams();
    
    // ใส่ค่าวัตถุดิบที่เลือก (คั่นด้วยคอมมา เช่น ?ingredients=ไก่,กระเทียม)
    if (selectedIngredients.length > 0) {
      params.append("ingredients", selectedIngredients.join(","));
    }
    
    // ใส่หมวดหมู่หลัก
    params.append("category", activeCategory);
    
    // ใส่ AI Provider ที่เลือกใช้งาน
    params.append("aiProvider", aiProvider);

    // วิ่งไปที่หน้าผลลัพธ์พร้อม Query String
    router.push(`/search/results?${params.toString()}`);
  };

  const currentCategoryData =
    categoriesData.find((cat) => cat.id === activeCategory) || categoriesData[0];

  const filteredIngredients = currentCategoryData.ingredients.filter((ing) =>
    ing.toLowerCase().includes(ingSearchTerm.toLowerCase())
  );

  return (
    <div className="w-[95%] max-w-[1200px] mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8 items-start">

      {/* ฝั่งซ้าย: รายการหมวดหมู่ */}
      <div className="w-full lg:w-[280px] shrink-0 flex flex-col gap-4">
        <span className="text-gray-800 font-bold text-sm pl-4 mb-1 block">
          เลือกวัตถุดิบ
        </span>

        <div className="flex flex-col gap-5 w-full">
          {categoriesData.map((cat) => {
            const isActive = cat.id === activeCategory;
            return (
              <div key={cat.id} className="flex items-center gap-3 relative group">
                {isActive && (
                  <div className="absolute -left-5 text-[#71B254] font-black text-2xl hidden lg:block animate-pulse">
                    ➔
                  </div>
                )}
                <button
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setIngSearchTerm("");
                    router.push(`/search?category=${cat.id}`);
                  }}
                  className={`w-full flex items-center gap-4 bg-white py-3 px-6 rounded-2xl transition-all duration-200 border-b-4 border-l-4 ${
                    isActive
                      ? "border-[#71B254] translate-x-1 translate-y-0.5 shadow-sm"
                      : "border-gray-300 hover:border-[#71B254]/50 shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  <div className="text-3xl shrink-0 select-none">{cat.emoji}</div>
                  <span className="font-bold text-gray-800 text-base">{cat.name}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ฝั่งขวา: Main Content Card */}
      <div className="flex-grow w-full bg-white border border-transparent rounded-[24px] p-8 md:p-12 shadow-sm min-h-[580px] flex flex-col justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-black mb-2 tracking-tight">
            คุณมีวัตถุดิบอะไรบ้าง?
          </h1>
          <p className="text-gray-500 text-base md:text-lg mb-6 font-medium">
            เลือกวัตถุดิบที่มีในตู้เย็น แล้วเราจะแนะนำสูตรอาหารด้วย AI ให้คุณ
          </p>

          {/* 🤖 ส่วนเลือก AI Provider ที่เพิ่มเข้ามาใหม่ */}
          <div className="bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-bold text-gray-800 block text-sm">เลือก AI ผู้ช่วยคิดสูตร</span>
              <span className="text-xs text-gray-400 font-medium">สลับเพื่อทดสอบการประมวลผลที่ต่างกัน</span>
            </div>
            <div className="flex gap-2 bg-gray-200/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setAiProvider("gemini")}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                  aiProvider === "gemini" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                ✨ Gemini Search
              </button>
              <button
                type="button"
                onClick={() => setAiProvider("deepseek")}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                  aiProvider === "deepseek" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                🐳 DeepSeek Search
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-6">
            <h2 className="text-xl font-black text-gray-900 pr-6">
              {currentCategoryData.name}
            </h2>

            {/* กล่องค้นหาวัตถุดิบ */}
            <div className="relative w-full sm:w-[260px]">
              <input
                type="text"
                placeholder={`ค้นหาใน${currentCategoryData.name}...`}
                value={ingSearchTerm}
                onChange={(e) => setIngSearchTerm(e.target.value)}
                className="w-full py-2 pl-4 pr-10 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#71B254] focus:bg-white transition-all shadow-inner"
              />
            </div>
          </div>

          {/* รายการวัตถุดิบ */}
          <div className="h-[220px] overflow-y-auto pr-2 border border-gray-50 rounded-xl p-4 bg-gray-50/30 scrollbar-thin">
            {filteredIngredients.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-8">
                {filteredIngredients.map((ingredient) => {
                  const isChecked = selectedIngredients.includes(ingredient);
                  return (
                    <label key={ingredient} className="flex items-center gap-3 cursor-pointer select-none group w-fit">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(ingredient)}
                        className="w-5 h-5 border-2 border-gray-400 rounded-md bg-white text-black focus:ring-0 cursor-pointer"
                      />
                      <span className="text-gray-800 font-bold text-base group-hover:text-black transition-colors">
                        {ingredient}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 italic text-base">
                ไม่พบวัตถุดิบที่ตรงกับ "{ingSearchTerm}"
              </div>
            )}
          </div>
        </div>

        {/* ส่วนท้ายปุ่มค้นหา */}
        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center w-full mt-6">
          <div className="flex flex-wrap items-center gap-2 max-w-xl">
            <span className="text-gray-800 font-extrabold text-lg mr-2">ที่เลือก:</span>
            {selectedIngredients.length > 0 ? (
              selectedIngredients.map((item) => (
                <span key={item} className="bg-[#E5E5E5] text-gray-800 font-bold text-sm px-4 py-1.5 rounded-md shadow-inner animate-scale-up">
                  {item}
                </span>
              ))
            ) : (
              <span className="text-gray-400 italic text-sm">ยังไม่ได้เลือก</span>
            )}
          </div>

          {/* เปลี่ยนจาก Link เป็นปุ่ม onClick เรียกฟังก์ชันแทน */}
          <button
            onClick={handleSearch}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#71B254] text-white font-extrabold text-base rounded-2xl hover:bg-[#5b9642] transition-all flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 active:translate-y-0 shrink-0 text-center cursor-pointer"
          >
            ค้นหาสูตรอาหาร ({aiProvider === "gemini" ? "Gemini" : "DeepSeek"}) <span>➔</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SearchIngredientsPage() {
  return (
    <div className={`${anuphan.className} min-h-screen bg-[#F5EFD7] pb-20 overflow-x-hidden`}>
      <Navbar />
      <Suspense fallback={<div className="text-center py-20 font-bold text-[#71B254]">กำลังโหลดวัตถุดิบ...</div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}