"use client";

import Image from "next/image";
import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Anuphan } from "next/font/google";
import type { FavoriteListResponse } from "@/types/recipes";
import { getAiAuthor } from "@/lib/ai-author";

const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80";
const FALLBACK_AVATAR = "/photo/default-avatar.svg";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<
    FavoriteListResponse["data"]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    setError(false);
    setUnauthorized(false);

    try {
      const res = await fetch("/api/favorites");
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      if (!res.ok) {
        setError(true);
        return;
      }
      const body = (await res.json()) as FavoriteListResponse;
      setFavorites(body.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // 🌟 ฟังก์ชันยกเลิกการบันทึกสูตรอาหาร (Optimistic UI - การ์ดหายทันที)
  const handleRemoveFavorite = async (recipeId: string) => {
    // 1. อัปเดต UI ทันที: กรองเอาการ์ดสูตรอาหารที่กดออกไปจากหน้าจอ
    setFavorites((prev) => prev.filter((item) => item.recipe.id !== recipeId));

    try {
      // 2. ยิง API สลับสถานะ (Toggle) เพื่อยกเลิกการบันทึกในฐานข้อมูล
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
      });

      if (!res.ok) {
        // Server rejected — restore the card so UI stays synced.
        console.warn("Failed to remove favorite on server, restoring card:", res.status);
        fetchFavorites();
      }
    } catch (error) {
      console.error("Network error removing favorite:", error);
      fetchFavorites();
    }
  };

  const favoritesCount = favorites.length;

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={star <= rating ? "#F1C40F" : "none"}
            stroke={star <= rating ? "#F1C40F" : "#71B254"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen bg-[#F5EFD7] pb-20 overflow-x-hidden ${anuphan.className}`}
    >
      <Navbar />

      <main className="w-[95%] max-w-[1000px] mx-auto px-4 mt-8">
        <div className="bg-white border border-gray-200 rounded-sm p-8 md:p-12 shadow-sm">
          <div className="mb-8 flex items-baseline gap-2">
            <h1 className="text-3xl font-bold text-gray-900">รายการโปรด</h1>
            <span className="text-2xl font-medium text-gray-400">
              ({favoritesCount})
            </span>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 border-4 border-[#71B254] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 font-medium">กำลังโหลดรายการโปรด...</p>
            </div>
          )}

          {!loading && unauthorized && (
            <div className="text-center py-20">
              <p className="text-lg font-bold text-gray-800">
                กรุณาเข้าสู่ระบบก่อนดูรายการโปรด
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
                onClick={fetchFavorites}
                className="mt-6 px-6 py-2.5 bg-[#71B254] text-white rounded-full text-sm font-bold hover:bg-[#5b9642] transition"
              >
                ลองอีกครั้ง
              </button>
            </div>
          )}

          {!loading && !unauthorized && !error && (
            <div className="flex flex-col gap-6">
              {favoritesCount > 0 ? (
                favorites.map((item) => {
                  const recipe = item.recipe;
                  const tags = recipe.recipeIngredients
                    .slice(0, 5)
                    .map((ri) => ri.ingredient.name);

                  return (
                    <div
                      key={item.id}
                      className="bg-white border-2 border-white rounded-sm p-8 shadow-sm mb-4 animate-fade-in"
                    >
                      <div className="flex flex-col md:flex-row gap-10">
                        <div className="w-full md:w-[350px] h-[350px] flex-shrink-0 relative">
                          <Image
                            src={recipe.images[0]?.imageUrl ?? FALLBACK_IMAGE}
                            alt={recipe.recipeName}
                            fill
                            className="object-cover rounded-3xl shadow-md"
                            sizes="350px"
                          />
                        </div>

                        <div className="flex flex-col justify-center gap-6 min-w-0">
                          <h1 className="text-4xl md:text-5xl font-bold text-[#71B254] leading-tight">
                            {recipe.recipeName}
                          </h1>

                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="bg-[#EAF5E4] text-[#5A9240] text-sm font-semibold px-3 py-1 rounded-md"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            {(() => {
                              const aiAuthor = getAiAuthor(recipe.aiProvider);
                              if (aiAuthor) {
                                return (
                                  <>
                                    <Image src={aiAuthor.logo} alt={`${aiAuthor.name} logo`} width={32} height={32} className="rounded-full object-cover shrink-0 bg-white" />
                                    <span className="font-bold text-gray-800 text-lg">{aiAuthor.name}</span>
                                  </>
                                );
                              }
                              return (
                                <>
                                  <Image
                                    src={recipe.user?.avatarUrl ?? FALLBACK_AVATAR}
                                    alt={recipe.user?.username ?? "ผู้เขียน"}
                                    width={32}
                                    height={32}
                                    className="rounded-full object-cover shrink-0"
                                  />
                                  <span className="font-bold text-gray-800 text-lg">
                                    {recipe.user?.username ?? "ผู้ไม่ประสงค์ออกนาม"}
                                  </span>
                                </>
                              );
                            })()}
                          </div>

                          <div className="flex items-center gap-8 mt-4">
                            {/* 🌟 หัวใจกดลบได้ (Optimistic UI) */}
                            <div
                              onClick={(e) => {
                                e.preventDefault();
                                handleRemoveFavorite(recipe.id);
                              }}
                              className="flex items-center gap-2 cursor-pointer group"
                              title="ยกเลิกการบันทึกสูตรนี้"
                            >
                              <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="#FF0000"
                                stroke="#FF0000"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="group-hover:scale-110 group-active:scale-95 transition-transform"
                              >
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                              </svg>
                              <span className="font-bold text-gray-700 text-lg group-hover:text-red-500 transition-colors">
                                {recipe.favoriteCount}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {renderStars(Math.round(recipe.rating))}
                              <span className="font-bold text-gray-800 text-lg ml-2">
                                {recipe.rating.toFixed(1)}
                              </span>
                            </div>
                          </div>

                          <Link
                            href={`/recipe/${recipe.id}`}
                            className="w-fit px-6 py-2.5 bg-[#71B254] text-white rounded-full text-sm font-bold hover:bg-[#5b9642] transition shadow-sm"
                          >
                            ดูสูตรอาหาร
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20 text-gray-400 italic text-lg animate-fade-in">
                  คุณยังไม่ได้กดถูกใจสูตรอาหารใด ๆ
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}