"use client";

import React, { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
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
// ⏱️ Custom Hook สำหรับ Debounce (หน่วงเวลา 300ms)
// =========================================
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// ข้อมูล metadata (ชื่อภาษาไทย + emoji) รายหมวดหมู่ — ingredients จะดึงจาก DB
const CATEGORY_META: Record<string, { name: string; emoji: string }> = {
  'Meat':                   { name: 'เนื้อสัตว์',            emoji: '🥩' },
  'Seafood':                { name: 'อาหารทะเล',            emoji: '🦞' },
  'Vegetables':             { name: 'ผัก',                    emoji: '🥦' },
  'Fruits':                 { name: 'ผลไม้',                 emoji: '🍊' },
  'Kitchen Tools':          { name: 'อุปกรณ์ครัว',         emoji: '🍳' },
  'Grains, Pasta & Baking': { name: 'ข้าว เส้น และแป้ง',   emoji: '🍞' },
  'Dairy & Eggs':           { name: 'ไข่และผลิตภัณฑ์นม',   emoji: '🥚' },
  'Condiments & Sauces':    { name: 'เครื่องปรุงและซอส',   emoji: '🧄' },
  'Spices & Herbs':         { name: 'เครื่องเทศและสมุนไพร',  emoji: '🌿' },
  'Nuts & Seeds':           { name: 'ถั่วและเมล็ดพืช',        emoji: '🥜' },
  'Fats & Oils':            { name: 'น้ำมันและไขมัน',       emoji: '🫒' },
  'Liquids & Beverages':    { name: 'เครื่องดื่มและของเหลว', emoji: '🍺' },
  'Others':                 { name: 'อื่นๆ',                  emoji: '📦' },
};

const thaiCollator = new Intl.Collator("th");

type CategoryItem = { id: string; name: string; emoji: string; ingredients: string[] };

function IngredientFilterPanel({
  currentCategoryData,
  selectedIngredients,
  onCheckboxChange,
  loading,
}: {
  currentCategoryData: CategoryItem | undefined;
  selectedIngredients: string[];
  onCheckboxChange: (ingredient: string) => void;
  loading?: boolean;
}) {
  const [ingSearchTerm, setIngSearchTerm] = useState("");
  
  // ใช้ Debounce กับช่องค้นหาวัตถุดิบ //
  const debouncedSearchTerm = useDebounce(ingSearchTerm, 300);

  if (loading) {
    return <div className="text-center py-20 text-gray-400 animate-pulse">กำลังโหลดวัตถุดิบ...</div>;
  }

  if (!currentCategoryData) {
    return <div className="text-center py-20 text-gray-400">ไม่พบหมวดหมู่</div>;
  }

  const filteredIngredients = currentCategoryData.ingredients.filter((ing) =>
    ing.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
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

      <div className="flex-1 overflow-y-auto pr-3 border border-gray-50 rounded-xl p-4 bg-gray-50/30 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {filteredIngredients.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
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
                    <div className="w-5 h-5 border-2 border-gray-400 rounded-md bg-white peer-checked:bg-[#71B254] peer-checked:border-[#71B254] transition-all flex items-center justify-center">
                      {isChecked && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-800 font-bold text-sm group-hover:text-black transition-colors">
                    {ingredient}
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 italic text-sm">
            ไม่พบวัตถุดิบที่ตรงกับ &quot;{ingSearchTerm}&quot;
          </div>
        )}
      </div>
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [dbIngredients, setDbIngredients] = useState<{name: string; category?: {name: string}}[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(true);

  useEffect(() => {
    fetch('/api/ingredients', { cache: 'no-store' })
      .then(r => r.json())
      .then(res => {
        if (res.data) setDbIngredients(res.data);
      })
      .catch(console.error)
      .finally(() => setLoadingIngredients(false));
  }, []);

  const categoriesData = React.useMemo(() => {
    const grouped: Record<string, string[]> = {};
    for (const ing of dbIngredients) {
      const catName: string = ing.category?.name ?? 'Others';
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push(ing.name);
    }

    const ORDER = [
      'Meat', 'Seafood', 'Vegetables', 'Fruits',
      'Grains, Pasta & Baking', 'Dairy & Eggs', 'Condiments & Sauces',
      'Spices & Herbs', 'Nuts & Seeds', 'Fats & Oils',
      'Liquids & Beverages', 'Kitchen Tools', 'Others',
    ];

    const result = ORDER
      .filter(id => grouped[id] && grouped[id].length > 0)
      .map(id => ({
        id,
        name: CATEGORY_META[id]?.name ?? id,
        emoji: CATEGORY_META[id]?.emoji ?? '🟡',
        ingredients: grouped[id].sort((a, b) => thaiCollator.compare(a, b)),
      }));

    for (const [id, names] of Object.entries(grouped)) {
      if (!ORDER.includes(id)) {
        result.push({ id, name: CATEGORY_META[id]?.name ?? id, emoji: CATEGORY_META[id]?.emoji ?? '🟡', ingredients: names.sort((a, b) => thaiCollator.compare(a, b)) });
      }
    }

    return result;
  }, [dbIngredients]);

  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  const handleCheckboxChange = (ingredient: string) => {
    if (selectedIngredients.includes(ingredient)) {
      setSelectedIngredients(selectedIngredients.filter((item) => item !== ingredient));
    } else {
      setSelectedIngredients([...selectedIngredients, ingredient]);
    }
  };

  const mergedCategoriesData = categoriesData;

  const rawCategory = searchParams.get('category');
  const activeCategory = React.useMemo(() => {
    if (!rawCategory) return mergedCategoriesData[0]?.id ?? '';
    const found = mergedCategoriesData.find(cat => cat.id === rawCategory || encodeURIComponent(cat.id) === rawCategory);
    return found?.id ?? mergedCategoriesData[0]?.id ?? '';
  }, [rawCategory, mergedCategoriesData]);

  const currentCategoryData = mergedCategoriesData.find((cat) => cat.id === activeCategory);

  const handleSearchSubmit = () => {
    if (selectedIngredients.length === 0) return;
    const ingredientQuery = selectedIngredients.join(",");
    const ingredientDisplay = selectedIngredients.join(", ");

    fetch("/api/search-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ searchQuery: ingredientDisplay }),
    }).catch(() => {
      // ignore
    });

    router.push(`/search/results?ingredients=${encodeURIComponent(ingredientQuery)}`);
  };

  return (
    <div className="w-[95%] max-w-[1200px] mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-6 items-stretch lg:h-[calc(100vh-120px)] lg:min-h-[600px] pb-8">

      {/* ฝั่งซ้าย: รายการหมวดหมู่ (ปรับให้เล็กกะทัดรัดขึ้น และเอา Scrollbar ออก) */}
      <div className="w-full lg:w-[240px] shrink-0 flex flex-col gap-2">
        <span className="text-gray-800 font-bold text-sm pl-2 mb-1 block shrink-0">
          เลือกหมวดหมู่
        </span>

        <div className="flex flex-col gap-2 w-full pb-2">
          {categoriesData.map((cat) => {
            const isActive = cat.id === activeCategory;
            return (
              <div key={cat.id} className="flex items-center gap-2 relative group w-full">
                <button
                  onClick={() => {
                    router.push(`/search?category=${encodeURIComponent(cat.id)}`);
                  }}
                  className={`w-full flex items-center gap-3 bg-white py-2 px-4 rounded-xl transition-all duration-200 border-l-4 ${
                    isActive
                      ? "border-[#71B254] bg-[#F0FDF4] shadow-sm transform translate-x-1"
                      : "border-transparent hover:border-[#71B254]/50 shadow-sm hover:translate-x-0.5"
                  }`}
                >
                  <div className="text-xl shrink-0 select-none">{cat.emoji}</div>
                  <span className={`text-sm ${isActive ? "font-extrabold text-[#15803D]" : "font-bold text-gray-700"}`}>
                    {cat.name}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ฝั่งขวา: Main Content Card */}
      <div className="flex-grow w-full bg-white border border-transparent rounded-[24px] p-6 md:p-8 shadow-sm flex flex-col overflow-hidden h-[600px] lg:h-auto">
        
        {/* Header เนื้อหา */}
        <div className="shrink-0 mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-black mb-2 tracking-tight">
            คุณมีวัตถุดิบอะไรบ้าง?
          </h1>
          <p className="text-gray-500 text-sm md:text-base font-medium">
            เลือกวัตถุดิบที่มีในตู้เย็น แล้วเราจะแนะนำสูตรอาหารให้คุณ
          </p>
        </div>

        {/* กล่องรายชื่อวัตถุดิบ */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <IngredientFilterPanel
            key={activeCategory}
            currentCategoryData={currentCategoryData}
            selectedIngredients={selectedIngredients}
            onCheckboxChange={handleCheckboxChange}
            loading={loadingIngredients}
          />
        </div>

        {/* Footer แถบแสดงวัตถุดิบที่เลือกและปุ่มค้นหา */}
        <div className="shrink-0 border-t border-gray-100 pt-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center w-full mt-4">
          <div className="flex flex-wrap items-center gap-2 flex-1 overflow-y-auto max-h-[80px] scrollbar-thin">
            <span className="text-gray-800 font-extrabold text-sm mr-1 shrink-0">
              ที่เลือก:
            </span>
            {selectedIngredients.length > 0 ? (
              selectedIngredients.map((item) => (
                <button
                  key={item}
                  onClick={() => handleCheckboxChange(item)}
                  title="คลิกเพื่อยกเลิก"
                  className="flex items-center gap-1.5 bg-[#EAF5E4] border border-[#71B254]/40 text-[#5A9240] font-bold text-xs px-3 py-1.5 rounded-full shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors animate-scale-up group"
                >
                  <span>{item}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              ))
            ) : (
              <span className="text-gray-400 italic text-xs">ยังไม่ได้เลือก</span>
            )}
          </div>

          <button
            disabled={selectedIngredients.length === 0}
            onClick={handleSearchSubmit}
            className="w-full sm:w-auto px-6 py-3 bg-[#71B254] text-white font-extrabold text-sm rounded-xl hover:bg-[#5b9642] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 active:translate-y-0 shrink-0 text-center cursor-pointer"
          >
            ค้นหาสูตรอาหาร <span>➔</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SearchIngredientsPage() {
  return (
    <div className={`${anuphan.className} min-h-screen bg-[#F5EFD7] overflow-x-hidden flex flex-col`}>
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