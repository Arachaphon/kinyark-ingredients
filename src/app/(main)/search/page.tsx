"use client";

import React, { useState, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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
// 🍱 ข้อมูลจำลองวัตถุดิบแบบครอบคลุมทั่วโลก (Mock Data)
// =========================================
const categoriesData = [
  {
    id: "Meat",
    name: "เนื้อสัตว์",
    emoji: "🥩",
    ingredients: [
      "ไก่", "หมู", "เนื้อวัว", "เนื้อแกะ", "เป็ด", "ไก่งวง", "เบคอน", "แฮม", "ไส้กรอก",
      "เนื้อกวาง", "เนื้อลูกวัว", "เนื้อแพะ", "เปปเปอโรนี", "ซาลามี", "พรอสชุตโต", "นกกระทา",
      "ห่าน", "วากิวบีฟ", "หมูสับ", "เนื้อสับ", "สามชั้น"
    ]
  },
  {
    id: "Fruits",
    name: "ผลไม้",
    emoji: "🥗",
    ingredients: [
      "แอปเปิ้ล", "กล้วย", "ส้ม", "สตรอว์เบอร์รี", "องุ่น", "แตงโม", "มะม่วง",
      "สับปะรด", "กีวี", "บลูเบอร์รี", "ราสพ์เบอร์รี", "แบล็คเบอร์รี", "พีช", "สาลี่",
      "พลัม", "เชอร์รี", "มะนาวเหลือง", "มะนาวเขียว", "มะพร้าว", "อะโวคาโด", "ทับทิม",
      "มะเดื่อ", "มะละกอ", "แก้วมังกร", "ทุเรียน", "ลิ้นจี่", "เมลอน"
    ]
  },
  {
    id: "Seafood",
    name: "อาหารทะเล",
    emoji: "🦞",
    ingredients: [
      "กุ้ง", "ปู", "แซลมอน", "ปลาหมึก", "หอยแมลงภู่", "กุ้งมังกร", "ปลาหมึกยักษ์", "หอยลาย",
      "หอยนางรม", "ปลาทูน่า", "ปลาคอด", "ปลาเทราต์", "ปลาแมคเคอเรล", "ปลากะพง", "ปลาซาร์ดีน",
      "หอยเชลล์", "เม่นทะเล (อูนิ)", "ปลาไหล (อูนางิ)", "คาเวียร์", "สาหร่าย", "แมงกะพรุน"
    ]
  },
  {
    id: "Vegetables",
    name: "ผัก",
    emoji: "🥦",
    ingredients: [
      "มะเขือเทศ", "หัวหอม", "กระเทียม", "แครอท", "มันฝรั่ง", "กะหล่ำปลี", "บรอกโคลี",
      "ผักโขม", "ผักกาดหอม", "แตงกวา", "พริกหยวก", "พริก", "เห็ด",
      "ขิง", "ตะไคร้", "หน่อไม้ฝรั่ง", "ซูกินี", "มะเขือยาว", "ข้าวโพด", "ถั่วลันเตา",
      "กะหล่ำดอก", "ขึ้นฉ่าย", "เคล", "ฟักทอง", "มันเทศ", "หัวไชเท้า", "ผักกวางตุ้ง"
    ]
  },
  {
    id: "Kitchen Tools",
    name: "อุปกรณ์ครัว",
    emoji: "🍳",
    ingredients: [
      "กระทะ", "หม้อ", "เตาอบ", "เครื่องปั่น", "แอร์ฟรายเออร์", "มีด", "ไมโครเวฟ", "เครื่องปิ้งขนมปัง",
      "ตะกร้อ", "กระต่ายขูด", "ที่ปอกเปลือก", "เขียงหั่น", "ถ้วยตวง", "พาย",
      "คีม", "ไม้นวดแป้ง", "หม้อหุงข้าว", "เครื่องประมวลผลอาหาร", "เครื่องผสม", "กระชอน"
    ]
  }
];

function IngredientFilterPanel({
  currentCategoryData,
  selectedIngredients,
  onCheckboxChange,
}: {
  currentCategoryData: (typeof categoriesData)[0];
  selectedIngredients: string[];
  onCheckboxChange: (ingredient: string) => void;
}) {
  const [ingSearchTerm, setIngSearchTerm] = useState("");

  const filteredIngredients = currentCategoryData.ingredients.filter((ing) =>
    ing.toLowerCase().includes(ingSearchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-6">
        <h2 className="text-xl font-black text-gray-900 pr-6">
          {currentCategoryData.name}
        </h2>

        <div className="relative w-full sm:w-[260px]">
          <input
            type="text"
            placeholder={`ค้นหาใน${currentCategoryData.name}...`}
            value={ingSearchTerm}
            onChange={(e) => setIngSearchTerm(e.target.value)}
            className="w-full py-2 pl-4 pr-10 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#71B254] focus:bg-white transition-all shadow-inner"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </div>
        </div>
      </div>

      <div className="h-[280px] overflow-y-auto pr-2 border border-gray-50 rounded-xl p-4 bg-gray-50/30 scrollbar-thin">
        {filteredIngredients.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-8">
            {filteredIngredients.map((ingredient) => {
              const isChecked = selectedIngredients.includes(ingredient);
              return (
                <label
                  key={ingredient}
                  className="flex items-center gap-3 cursor-pointer select-none group w-fit"
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onCheckboxChange(ingredient)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 border-2 border-gray-400 rounded-md bg-white peer-checked:bg-black peer-checked:border-black transition-all flex items-center justify-center">
                      {isChecked && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-800 font-bold text-base group-hover:text-black transition-colors">
                    {ingredient}
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 italic text-base">
            ไม่พบวัตถุดิบที่ตรงกับ &quot;{ingSearchTerm}&quot;
          </div>
        )}
      </div>
    </>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeCategory = searchParams.get("category") || "Meat";
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(["ไก่"]);

  const handleCheckboxChange = (ingredient: string) => {
    if (selectedIngredients.includes(ingredient)) {
      setSelectedIngredients(selectedIngredients.filter((item) => item !== ingredient));
    } else {
      setSelectedIngredients([...selectedIngredients, ingredient]);
    }
  };

  const currentCategoryData =
    categoriesData.find((cat) => cat.id === activeCategory) || categoriesData[0];

  return (
    <div className="w-[95%] max-w-[1200px] mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8 items-start">

      {/* =========================================
          ฝั่งซ้าย: รายการหมวดหมู่ (เลือกวัตถุดิบ)
          ========================================= */}
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

      {/* =========================================
          ฝั่งขวา: การ์ดใหญ่เลือกวัตถุดิบ (Main Content Card)
          ========================================= */}
      <div className="flex-grow w-full bg-white border border-transparent rounded-[24px] p-8 md:p-12 shadow-sm min-h-[580px] flex flex-col justify-between">

        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-black mb-2 tracking-tight">
            คุณมีวัตถุดิบอะไรบ้าง?
          </h1>
          <p className="text-gray-500 text-base md:text-lg mb-6 font-medium">
            เลือกวัตถุดิบที่มีในตู้เย็น แล้วเราจะแนะนำสูตรอาหารให้คุณ
          </p>

          <IngredientFilterPanel
            key={activeCategory}
            currentCategoryData={currentCategoryData}
            selectedIngredients={selectedIngredients}
            onCheckboxChange={handleCheckboxChange}
          />
        </div>

        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center w-full mt-6">
          <div className="flex flex-wrap items-center gap-2 max-w-xl">
            <span className="text-gray-800 font-extrabold text-lg mr-2">
              ที่เลือก:
            </span>
            {selectedIngredients.length > 0 ? (
              selectedIngredients.map((item) => (
                <span
                  key={item}
                  className="bg-[#E5E5E5] text-gray-800 font-bold text-sm px-4 py-1.5 rounded-md shadow-inner animate-scale-up"
                >
                  {item}
                </span>
              ))
            ) : (
              <span className="text-gray-400 italic text-sm">ยังไม่ได้เลือก</span>
            )}
          </div>

          {/* ปุ่มส่งไปยังหน้าสรุปผลลัพธ์การค้นหาสูตรอาหาร */}
          <Link
            href="/search/results?query=สลัด"
            className="w-full sm:w-auto px-6 py-3.5 bg-[#71B254] text-white font-extrabold text-base rounded-2xl hover:bg-[#5b9642] transition-all flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 active:translate-y-0 shrink-0 text-center block"
          >
            ค้นหาสูตรอาหาร <span>➔</span>
          </Link>
        </div>

      </div>

    </div>
  );
}

export default function SearchIngredientsPage() {
  return (
    // ✅ ใส่ anuphan.className ตรงนี้จุดเดียว ครอบคลุมทั้งหน้า
    <div className={`${anuphan.className} min-h-screen bg-[#F5EFD7] pb-20 overflow-x-hidden`}>
      <Navbar />
      <Suspense
        fallback={
          <div className="text-center py-20 font-bold text-[#71B254]">
            กำลังโหลดวัตถุดิบ...
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </div>
  );
}