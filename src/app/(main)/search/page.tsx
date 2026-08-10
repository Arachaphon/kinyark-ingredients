"use client";

import React, { useState, useEffect, Suspense } from "react";
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
  
  // ใช้ Debounce กับช่องค้นหาวัตถุดิบ
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
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-6">
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

      <div className="flex-1 min-h-[280px] overflow-y-auto pr-2 border border-gray-50 rounded-xl p-4 bg-gray-50/30 scrollbar-thin">
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

  // สร้าง categories จาก DB จัดกลุ่มตาม category.name
  const categoriesData = React.useMemo(() => {
    const grouped: Record<string, string[]> = {};
    for (const ing of dbIngredients) {
      const catName: string = ing.category?.name ?? 'Others';
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push(ing.name);
    }

    // เรียงหมวดตามลำดับที่ต้องการ
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
        ingredients: grouped[id].sort((a, b) => a.localeCompare(b, 'th')),
      }));

    // เพิ่มหมวดที่ไม่อยู่ใน ORDER
    for (const [id, names] of Object.entries(grouped)) {
      if (!ORDER.includes(id)) {
        result.push({ id, name: CATEGORY_META[id]?.name ?? id, emoji: CATEGORY_META[id]?.emoji ?? '🟡', ingredients: names.sort((a, b) => a.localeCompare(b, 'th')) });
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
    // ตรวจว่ามีใน list จริง (กรณี URL encode)
    const found = mergedCategoriesData.find(cat => cat.id === rawCategory || encodeURIComponent(cat.id) === rawCategory);
    return found?.id ?? mergedCategoriesData[0]?.id ?? '';
  }, [rawCategory, mergedCategoriesData]);

  const currentCategoryData = mergedCategoriesData.find((cat) => cat.id === activeCategory);

  return (
    <div className="w-[95%] max-w-[1200px] mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8 items-stretch">

      {/* ฝั่งซ้าย: รายการหมวดหมู่ */}
      <div className="w-full lg:w-[280px] shrink-0 flex flex-col gap-4">
        <span className="text-gray-800 font-bold text-sm pl-4 mb-1 block">
          เลือกวัตถุดิบ
        </span>

        <div className="flex flex-col gap-5 w-full pb-10">
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
                    router.push(`/search?category=${encodeURIComponent(cat.id)}`);
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
      <div className="flex-grow w-full bg-white border border-transparent rounded-[24px] p-8 md:p-12 shadow-sm flex flex-col">
        
        <div className="shrink-0">
          <h1 className="text-3xl md:text-4xl font-extrabold text-black mb-2 tracking-tight">
            คุณมีวัตถุดิบอะไรบ้าง?
          </h1>
          <p className="text-gray-500 text-base md:text-lg mb-6 font-medium">
            เลือกวัตถุดิบที่มีในตู้เย็น แล้วเราจะแนะนำสูตรอาหารให้คุณ
          </p>
        </div>

        <div className="flex-1 flex flex-col min-h-[300px]">
          <IngredientFilterPanel
            key={activeCategory}
            currentCategoryData={currentCategoryData}
            selectedIngredients={selectedIngredients}
            onCheckboxChange={handleCheckboxChange}
            loading={loadingIngredients}
          />
        </div>

        <div className="shrink-0 border-t border-gray-100 pt-6 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center w-full mt-6">
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

          <Link
            href={`/search/results?ingredients=${selectedIngredients.join(",")}`}
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