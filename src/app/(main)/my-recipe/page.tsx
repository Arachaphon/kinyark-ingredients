"use client";

import Image from "next/image";
import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Anuphan } from "next/font/google";
import type { RecipeListResponse, RecipeListItem } from "@/types/recipes";

const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80";

type Tab = "All" | "Publish" | "Draft";

const formatThaiDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

export default function MyRecipePage() {
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("All");

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError(false);
    setUnauthorized(false);

    try {
      const res = await fetch("/api/recipes?mine=true&limit=50");
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      if (!res.ok) {
        setError(true);
        return;
      }
      const body = (await res.json()) as RecipeListResponse;
      setRecipes(body.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const allCount = recipes.length;
  const publishCount = recipes.filter((r) => r.visibility === "public").length;
  const draftCount = recipes.filter((r) => r.visibility === "private").length;

  const displayedRecipes = recipes.filter((recipe) => {
    if (activeTab === "All") return true;
    if (activeTab === "Publish") return recipe.visibility === "public";
    if (activeTab === "Draft") return recipe.visibility === "private";
    return true;
  });

  return (
    <div
      className={`min-h-screen bg-[#F5EFD7] pb-20 overflow-x-hidden ${anuphan.className}`}
    >
      <Navbar />

      <main className="w-[95%] max-w-[1000px] mx-auto px-4 mt-8">
        <div className="bg-white border border-[#71B254] rounded-sm p-6 md:p-10 shadow-sm">
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 border-4 border-[#71B254] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 font-medium">กำลังโหลดสูตรของฉัน...</p>
            </div>
          )}

          {!loading && unauthorized && (
            <div className="text-center py-20">
              <p className="text-lg font-bold text-gray-800">
                กรุณาเข้าสู่ระบบก่อนดูสูตรของคุณ
              </p>
              <Link
                href="/login"
                className="inline-block mt-6 px-6 py-2.5 bg-[#71B254] text-white rounded-full text-sm font-bold hover:bg-[#5b9642] transition"
              >
                เข้าสู่ระบบ
              </Link>
            </div>
          )}

          {!loading && !unauthorized && error && (
            <div className="text-center py-20">
              <p className="text-lg font-bold text-red-600">
                เกิดข้อผิดพลาดในการโหลดข้อมูล
              </p>
              <button
                onClick={fetchRecipes}
                className="mt-6 px-6 py-2.5 bg-[#71B254] text-white rounded-full text-sm font-bold hover:bg-[#5b9642] transition"
              >
                ลองอีกครั้ง
              </button>
            </div>
          )}

          {!loading && !unauthorized && !error && (
            <>
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
                          src={recipe.images[0]?.imageUrl ?? FALLBACK_IMAGE}
                          alt={recipe.recipeName}
                          fill
                          className="object-cover rounded-lg"
                          sizes="144px"
                        />
                      </div>

                      <div className="flex-grow flex flex-col justify-between w-full">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-gray-900">
                              {recipe.recipeName}
                            </h3>
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-sm ${
                                recipe.visibility === "public"
                                  ? "bg-[#EAF5E4] text-[#5A9240]"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {recipe.visibility === "public"
                                ? "เผยแพร่แล้ว"
                                : "ฉบับร่าง"}
                            </span>
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
                            <span>{recipe.favoriteCount}</span>
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
                          <div className="text-gray-400">
                            เผยแพร่เมื่อ {formatThaiDate(recipe.createdAt)}
                          </div>
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
            </>
          )}
        </div>
      </main>
    </div>
  );
}
