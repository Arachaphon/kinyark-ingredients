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

// กำหนด Interface สำหรับข้อมูลสูตรอาหารที่ตอบกลับมาจาก API (อิงจาก Prisma Schema)
interface Recipe {
  id: string; // Prisma ใช้ UUID
  title: string; // แมปกับ recipeName
  image: string; // ดึงมาจาก images[0].imageUrl
  tags: string[]; // อาจจะดึงมาจาก recipeIngredients
  author: string;
  authorAvatar: string;
  likes: number; // แมปกับ favoriteCount
  rating: number; // แมปกับ rating
  initialFavorite: boolean;
  aiProvider: string; // gemini หรือ deepseek
}

function ResultsContent() {
  const searchParams = useSearchParams();

  // 1. ดึง Query Parameters จากหน้า Search
  const queryTitle = searchParams.get("query") || "เมนูแนะนำ";
  const ingredientsParam = searchParams.get("ingredients") || "";
  const categoryParam = searchParams.get("category") || "";
  const aiProviderParam = searchParams.get("aiProvider") || "gemini"; // ค่าเริ่มต้นเป็น gemini

  // แปลง string ของวัตถุดิบเป็น array เพื่อนำไปแสดงผล
  const selectedIngredients = ingredientsParam ? ingredientsParam.split(",") : [];

  // State สำหรับเก็บข้อมูล
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  // 2. useEffect สำหรับ Fetch ข้อมูลจาก API (หรือจำลองการ Fetch)
  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(true);
      
      try {
        // ---------------------------------------------------------
        // 🚀 ส่วนนี้คือจุดที่คุณจะต้องเปลี่ยนไปเรียก API ของคุณจริงๆ
        // ---------------------------------------------------------
        /*
        const response = await fetch(`/api/recipes/generate?ingredients=${ingredientsParam}&ai=${aiProviderParam}`);
        const data = await response.json();
        setRecipes(data);
        */

        // ---------------------------------------------------------
        // 🛑 จำลองข้อมูล (Mock Data) สำหรับการทดสอบ (ลบออกได้เมื่อต่อ API จริง)
        // ---------------------------------------------------------
        await new Promise((resolve) => setTimeout(resolve, 1500)); // จำลองดีเลย์ 1.5 วินาที

        const mockData: Recipe[] = [
          {
            id: "uuid-1",
            title: selectedIngredients.length > 0 ? `ผัด${selectedIngredients[0]}กระเทียม` : "สลัดซีซาร์สวนผัก",
            image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80",
            tags: selectedIngredients.length > 0 ? selectedIngredients : ["มะเขือเทศ", "กะหล่ำปลี", "ครูตอง"],
            author: aiProviderParam === "deepseek" ? "DeepSeek 3" : "Gemini 1.5 Pro",
            authorAvatar: aiProviderParam === "deepseek" 
              ? "https://th.bing.com/th/id/OIP.Yj7X4K_j4x4896086_8z6QHaHa?rs=1&pid=ImgDetMain" // โลโก้สมมติของ Deepseek
              : "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg",
            likes: 22,
            rating: 4.8,
            initialFavorite: false,
            aiProvider: aiProviderParam
          },
          {
            id: "uuid-2",
            title: "ต้มยำ(สูตรประยุกต์)",
            image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=300&q=80",
            tags: ["พริก", "มะนาว", ...selectedIngredients].slice(0, 5),
            author: "User: Chef Man",
            authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
            likes: 52,
            rating: 4.5,
            initialFavorite: true,
            aiProvider: "user"
          }
        ];

        setRecipes(mockData);
        
        // เตรียม State สำหรับปุ่มหัวใจ
        const initialFavs: Record<string, boolean> = {};
        mockData.forEach(r => {
           initialFavs[r.id] = r.initialFavorite;
        });
        setFavorites(initialFavs);

      } catch (error) {
        console.error("Error fetching recipes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();
  }, [ingredientsParam, categoryParam, aiProviderParam]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
    // ตรงนี้อาจจะเพิ่มโค้ดสำหรับยิง API ไปอัปเดต Favorite ในฐานข้อมูล (ตาราง Favorite)
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-sm p-16 shadow-sm flex flex-col items-center justify-center min-h-[500px]">
         <div className="w-16 h-16 border-4 border-[#71B254] border-t-transparent rounded-full animate-spin mb-4"></div>
         <h2 className="text-2xl font-bold text-gray-800">กำลังวิเคราะห์วัตถุดิบ...</h2>
         <p className="text-gray-500 mt-2">
           {aiProviderParam.toUpperCase()} กำลังคิดสูตรอาหารที่ใช่สำหรับคุณ
         </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-[24px] p-8 md:p-12 shadow-sm">

      {/* =========================================
          ส่วนหัว: บอกรายละเอียดว่าหาด้วยอะไร
          ========================================= */}
      <div className="mb-8">
        <div className="flex items-baseline gap-2 mb-3">
          <h1 className="text-3xl font-bold text-gray-900">สูตรอาหารแนะนำ</h1>
          <span className="text-2xl font-medium text-gray-400">
            ({recipes.length})
          </span>
        </div>
        
        {/* แสดงสรุป Filter ที่รับมา */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
            <span className="text-gray-500">ประมวลผลโดย:</span>
            <span className="font-bold text-[#71B254]">{aiProviderParam.toUpperCase()}</span>
          </div>
          
          {selectedIngredients.length > 0 && (
             <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
               <span className="text-gray-500">วัตถุดิบ:</span>
               <span className="font-bold text-gray-800">{selectedIngredients.join(", ")}</span>
             </div>
          )}
        </div>
      </div>

      {/* =========================================
          ส่วนเนื้อหา: รายการอาหารแนะนำจาก AI และ User
          ========================================= */}
      <div className="flex flex-col gap-6">
        {recipes.length === 0 ? (
           <div className="text-center py-12 text-gray-500">ไม่พบสูตรอาหารที่ตรงกับวัตถุดิบของคุณ ลองเลือกใหม่นะครับ</div>
        ) : (
          recipes.map((recipe) => {
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
                    <div className="flex items-start justify-between">
                       <h3 className="text-2xl font-bold text-gray-900 mb-3">
                         {recipe.title}
                       </h3>
                       {/* ป้ายบอกว่าเป็นสูตรจาก AI หรือคน */}
                       {recipe.aiProvider !== "user" && (
                         <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded">
                           AI Generated
                         </span>
                       )}
                    </div>

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
               กำลังเตรียมหน้าจอผลลัพธ์...
            </div>
          }
        >
          <ResultsContent />
        </Suspense>
      </main>
    </div>
  );
}