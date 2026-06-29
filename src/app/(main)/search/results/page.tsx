"use client";

import React, { useState, Suspense } from "react";
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
// 🍱 ข้อมูลจำลองเมนูที่ค้นหาเจอ (Mock Data)
// =========================================
const mockSearchResults = [
  {
    id: 1,
    title: "สลัดซีซาร์สวนผัก",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80",
    tags: ["มะเขือเทศ", "หัวหอมหวาน", "พริกไทย", "กะหล่ำปลี", "ครูตอง"],
    author: "Alice",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    likes: 22,
    rating: 3.0,
    initialFavorite: false,
  },
  {
    id: 2,
    title: "สลัด (ง่ายและสดใหม่)",
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=300&q=80",
    tags: ["แตงกวา", "มะเขือเทศ", "แครอท", "ผักสลัด", "พริกหยวกแดง"],
    author: "Chat GPT 5.4",
    authorAvatar: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
    likes: 52,
    rating: 4.5,
    initialFavorite: false,
  },
  {
    id: 3,
    title: "สลัดผลไม้",
    image: "https://images.unsplash.com/photo-1490474418585-ba9f52fce124?auto=format&fit=crop&w=300&q=80",
    tags: ["สับปะรด", "สตรอว์เบอร์รี", "องุ่น", "ส้ม", "กีวี"],
    author: "Gemini 2.5",
    authorAvatar: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg",
    likes: 65,
    rating: 2.5,
    initialFavorite: true,
  },
];

function ResultsContent() {
  const searchParams = useSearchParams();

  // จำลองดึงคำที่ค้นหาเพื่อเอามาตั้งเป็นหัวข้อ
  const queryTitle = searchParams.get("query") || "สลัด";

  // State จัดการระบบกดหัวใจของการ์ดแต่ละใบแยกกัน
  const [favorites, setFavorites] = useState<Record<number, boolean>>(
    mockSearchResults.reduce(
      (acc, current) => ({ ...acc, [current.id]: current.initialFavorite }),
      {}
    )
  );

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-8 md:p-12 shadow-sm">

      {/* =========================================
          ส่วนหัว: ชื่อผลลัพธ์และจำนวนที่ค้นพบ
          ========================================= */}
      <div className="mb-8 flex items-baseline gap-2">
        <h1 className="text-3xl font-bold text-gray-900">{queryTitle}</h1>
        <span className="text-2xl font-medium text-gray-400">
          ({mockSearchResults.length * 4})
        </span>
      </div>

      {/* =========================================
          ส่วนเนื้อหา: รายการอาหารแนะนำจาก AI และ User
          ========================================= */}
      <div className="flex flex-col gap-6">
        {mockSearchResults.map((recipe) => {
          const isLiked = favorites[recipe.id];
          return (
            <div
              key={recipe.id}
              className="flex flex-col md:flex-row gap-6 p-4 border border-[#71B254] rounded-xl bg-white hover:shadow-md transition-shadow relative"
            >

              {/* ซ้าย: รูปภาพอาหารตัวอย่าง */}
              <div className="w-full md:w-[180px] h-[160px] flex-shrink-0">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

              {/* กลาง: รายละเอียด ชื่อสูตร, ป้ายวัตถุดิบ, คนโพสต์ */}
              <div className="flex-grow flex flex-col justify-between py-1">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {recipe.title}
                  </h3>

                  {/* ป้ายวัตถุดิบ (Tags) */}
                  <div className="flex flex-wrap gap-2">
                    {recipe.tags.map((tag, idx) => (
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
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gray-50 border border-gray-100">
                    <img
                      src={recipe.authorAvatar}
                      alt={recipe.author}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-bold text-gray-800 text-sm">
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
                      {isLiked ? recipe.likes + 1 : recipe.likes}
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
                      {recipe.rating.toFixed(1)}
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
        })}
      </div>

    </div>
  );
}

export default function SearchResultsPage() {
  return (
    // ✅ ใส่ anuphan.className ตรงนี้จุดเดียว ครอบคลุมทั้งหน้า
    <div className={`${anuphan.className} min-h-screen bg-[#F5EFD7] pb-20 overflow-x-hidden`}>

      {/* 1. แถบเมนูนำทางด้านบน */}
      <Navbar />

      {/* 2. ส่วนเนื้อหาโครงสร้างการ์ดแนะนำสูตรอาหาร */}
      <main className="w-[95%] max-w-[1000px] mx-auto px-4 mt-8">
        <Suspense
          fallback={
            <div className="text-center py-20 font-bold text-[#71B254]">
              กำลังวิเคราะห์วัตถุดิบ...
            </div>
          }
        >
          <ResultsContent />
        </Suspense>
      </main>

    </div>
  );
}