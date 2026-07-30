"use client";

import Image from "next/image";
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Anuphan } from "next/font/google";

const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

// =========================================
// 🍱 ข้อมูลจำลองสำหรับหน้า My Recipe (Mock Data)
// =========================================
const mockRecipes = [
  {
    id: 1,
    title: "สลัดซีซาร์การ์เดน",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80",
    tags: ["มะเขือเทศ", "หอมหัวใหญ่หวาน", "พริกไทย", "กะหล่ำปลี", "ครูตอง"],
    likes: 22,
    rating: 3.0,
    date: "เผยแพร่เมื่อ 3 มีนาคม 2026",
    status: "published",
  },
  {
    id: 2,
    title: "สลัดซีซาร์การ์เดน",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80",
    tags: ["มะเขือเทศ", "หอมหัวใหญ่หวาน", "พริกไทย", "กะหล่ำปลี", "ครูตอง"],
    likes: 22,
    rating: 3.0,
    date: "เผยแพร่เมื่อ 3 มีนาคม 2026",
    status: "published",
  },
  {
    id: 3,
    title: "สลัดซีซาร์การ์เดน",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80",
    tags: ["มะเขือเทศ", "หอมหัวใหญ่หวาน", "พริกไทย", "กะหล่ำปลี", "ครูตอง"],
    likes: 22,
    rating: 3.0,
    date: "เผยแพร่เมื่อ 3 มีนาคม 2026",
    status: "published",
  },
  {
    id: 4,
    title: "สลัดซีซาร์การ์เดน",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80",
    tags: ["มะเขือเทศ", "หอมหัวใหญ่หวาน", "พริกไทย", "กะหล่ำปลี", "ครูตอง"],
    likes: 22,
    rating: 3.0,
    date: "เผยแพร่เมื่อ 3 มีนาคม 2026",
    status: "published",
  },
  {
    id: 5,
    title: "สลัดซีซาร์การ์เดน",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80",
    tags: ["มะเขือเทศ", "หอมหัวใหญ่หวาน", "พริกไทย", "กะหล่ำปลี", "ครูตอง"],
    likes: 22,
    rating: 3.0,
    date: "เผยแพร่เมื่อ 3 มีนาคม 2026",
    status: "published",
  },
  {
    id: 6,
    title: "สลัดเนื้อรสจัด (ฉบับร่าง)",
    image:
      "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=300&q=80",
    tags: ["เนื้อวัว", "พริก", "มะนาว", "หัวหอม"],
    likes: 0,
    rating: 0.0,
    date: "แก้ไขล่าสุดเมื่อ 4 มีนาคม 2026",
    status: "draft",
  },
  {
    id: 7,
    title: "โบลผลไม้เพื่อสุขภาพ (ฉบับร่าง)",
    image:
      "https://images.unsplash.com/photo-1490474418585-ba9f52fce124?auto=format&fit=crop&w=300&q=80",
    tags: ["แอปเปิล", "กล้วย", "น้ำผึ้ง", "โยเกิร์ต"],
    likes: 0,
    rating: 0.0,
    date: "แก้ไขล่าสุดเมื่อ 5 มีนาคม 2026",
    status: "draft",
  },
];

export default function MyRecipePage() {
  const [activeTab, setActiveTab] = useState<"All" | "Publish" | "Draft">("All");

  const allCount = mockRecipes.length;
  const publishCount = mockRecipes.filter((r) => r.status === "published").length;
  const draftCount = mockRecipes.filter((r) => r.status === "draft").length;

  const displayedRecipes = mockRecipes.filter((recipe) => {
    if (activeTab === "All") return true;
    if (activeTab === "Publish") return recipe.status === "published";
    if (activeTab === "Draft") return recipe.status === "draft";
    return true;
  });

  return (
    <div
      className={`min-h-screen bg-[#F5EFD7] pb-20 overflow-x-hidden ${anuphan.className}`}
    >
      <Navbar />

      <main className="w-[95%] max-w-[1000px] mx-auto px-4 mt-8">
        <div className="bg-white border border-[#71B254] rounded-sm p-6 md:p-10 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <button
              onClick={() => setActiveTab("All")}
              className={`px-5 py-2 rounded-md font-medium transition ${
                activeTab === "All"
                  ? "bg-[#71B254] text-white border border-[#71B254]"
                  : "bg-white text-gray-500 border border-gray-300 hover:border-[#71B254] hover:text-[#71B254]"
              }`}
            >
              ทั้งหมด ({allCount})
            </button>

            <button
              onClick={() => setActiveTab("Publish")}
              className={`px-5 py-2 rounded-md font-medium transition ${
                activeTab === "Publish"
                  ? "bg-[#71B254] text-white border border-[#71B254]"
                  : "bg-white text-gray-500 border border-gray-300 hover:border-[#71B254] hover:text-[#71B254]"
              }`}
            >
              เผยแพร่แล้ว ({publishCount})
            </button>

            <button
              onClick={() => setActiveTab("Draft")}
              className={`px-5 py-2 rounded-md font-medium transition ${
                activeTab === "Draft"
                  ? "bg-[#71B254] text-white border border-[#71B254]"
                  : "bg-white text-gray-500 border border-gray-300 hover:border-[#71B254] hover:text-[#71B254]"
              }`}
            >
              ฉบับร่าง ({draftCount})
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {displayedRecipes.length > 0 ? (
              displayedRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="flex flex-col md:flex-row items-center gap-6 p-4 border border-gray-200 rounded-xl bg-white hover:shadow-md transition-shadow"
                >
                  <div className="w-full md:w-36 h-36 flex-shrink-0 relative">
                    <Image
                      src={recipe.image}
                      alt={recipe.title}
                      fill
                      className="object-cover rounded-lg"
                      sizes="144px"
                    />
                  </div>

                  <div className="flex-grow flex flex-col justify-between w-full">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {recipe.title}
                      </h3>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {recipe.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="bg-[#EAF5E4] text-[#5A9240] text-xs font-semibold px-2.5 py-1 rounded-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-5 mt-5 text-gray-500 text-sm font-medium">
                      <div className="flex items-center gap-1.5">
                        <svg
                          width="18"
                          height="18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span>{recipe.likes}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg
                          width="18"
                          height="18"
                          fill="#F1C40F"
                          stroke="#F1C40F"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          viewBox="0 0 24 24"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        <span>{recipe.rating.toFixed(1)}</span>
                      </div>
                      <div className="text-gray-400">{recipe.date}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full md:w-36 shrink-0 mt-4 md:mt-0">
                    <Link
                      href={`/my-recipe/edit/${recipe.id}`}
                      className="w-full text-center py-1.5 px-4 border border-[#F39C12] text-[#F39C12] rounded-full text-sm font-bold hover:bg-orange-50 transition block"
                    >
                      แก้ไข
                    </Link>

                    <button className="w-full py-1.5 px-4 border border-[#E74C3C] text-[#E74C3C] rounded-full text-sm font-bold hover:bg-red-50 transition">
                      ลบ
                    </button>

                    <Link
                      href={`/recipe/${recipe.id}`}
                      className="w-full text-center py-1.5 px-4 border border-gray-700 text-gray-700 rounded-full text-sm font-bold hover:bg-gray-100 transition block"
                    >
                      ดูสูตรอาหาร
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-gray-400 italic text-lg">
                ไม่พบสูตรอาหารในหมวดหมู่นี้
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}