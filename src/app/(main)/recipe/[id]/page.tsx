"use client";

import Image from "next/image";
import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { useParams, useRouter } from "next/navigation";
import { Anuphan } from "next/font/google";
import type { RecipeDetail } from "@/types/recipes";
import { translateUnit } from "@/lib/units";

const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80";
const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1531123897727-8f129e120a4?auto=format&fit=crop&w=150&q=80";

export default function ViewRecipePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const recipeId = Array.isArray(id) ? id[0] : id;

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);

  const fetchRecipe = useCallback(async () => {
    if (!recipeId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);
    setError(false);

    try {
      const res = await fetch(`/api/recipes/${recipeId}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) {
        setError(true);
        return;
      }
      const body = await res.json();
      setRecipe(body.data as RecipeDetail);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  const toggleFavorite = async () => {
    if (!recipe || isFavoriting) return;

    setIsFavoriting(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipe.id }),
      });

      if (res.status === 401) {
        alert("กรุณาเข้าสู่ระบบก่อนกดถูกใจ");
        return;
      }

      if (!res.ok) return;

      const body = await res.json();
      const { favorited } = body.data as { favorited: boolean };

      setRecipe((prev) =>
        prev
          ? {
              ...prev,
              isFavorite: favorited,
              favoriteCount: Math.max(
                0,
                prev.favoriteCount + (favorited ? 1 : -1)
              ),
            }
          : prev
      );
    } catch {
      // network error — keep current state
    } finally {
      setIsFavoriting(false);
    }
  };

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

  const renderEmptyStars = () => {
    return (
      <div className="flex items-center gap-1 cursor-pointer">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#A5A5A5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="hover:stroke-[#F1C40F] hover:fill-[#F1C40F] transition"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        ))}
      </div>
    );
  };

  const coverImage = recipe?.images[0]?.imageUrl ?? FALLBACK_IMAGE;
  const authorAvatar = recipe?.user?.avatarUrl ?? FALLBACK_AVATAR;
  const instructions = (recipe?.instructions ?? "")
    .split(/\r?\n/)
    .map((step) => step.trim())
    .filter(Boolean);

  return (
    <div
      className={`min-h-screen bg-[#F5EFD7] pb-20 overflow-x-hidden ${anuphan.className}`}
    >
      <Navbar />

      <main className="w-[95%] max-w-[1000px] mx-auto px-4 mt-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 border-4 border-[#71B254] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 font-medium">กำลังโหลดสูตรอาหาร...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white border border-red-300 rounded-sm p-12 text-center shadow-sm">
            <p className="text-lg font-bold text-red-600">
              เกิดข้อผิดพลาดในการโหลดข้อมูล
            </p>
            <button
              onClick={fetchRecipe}
              className="mt-6 px-6 py-2.5 bg-[#71B254] text-white rounded-full text-sm font-bold hover:bg-[#5b9642] transition"
            >
              ลองอีกครั้ง
            </button>
          </div>
        )}

        {!loading && !error && notFound && (
          <div className="bg-white border border-gray-200 rounded-sm p-12 text-center shadow-sm">
            <p className="text-lg font-bold text-gray-800">
              ไม่พบสูตรอาหารนี้ หรือสูตรนี้ถูกตั้งเป็นส่วนตัว
            </p>
            <button
              onClick={() => router.back()}
              className="mt-6 px-6 py-2.5 bg-[#71B254] text-white rounded-full text-sm font-bold hover:bg-[#5b9642] transition"
            >
              กลับไปหน้าก่อนหน้า
            </button>
          </div>
        )}

        {!loading && !error && !notFound && recipe && (
          <>
            <div className="bg-white border border-[#71B254] rounded-sm p-8 shadow-sm relative mb-6">
              <button
                onClick={() => router.back()}
                className="absolute top-4 left-6 w-8 h-8 bg-[#71B254] text-white rounded-full flex items-center justify-center hover:bg-[#5b9642] transition z-10 shadow-sm"
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>

              <div className="flex flex-col md:flex-row gap-10 mt-14 md:mt-6">
                <div className="w-full md:w-[350px] h-[350px] flex-shrink-0 relative">
                  <Image
                    src={coverImage}
                    alt={recipe.recipeName}
                    fill
                    className="object-cover rounded-3xl shadow-md"
                    sizes="350px"
                  />
                </div>

                <div className="flex flex-col justify-center gap-6">
                  <h1 className="text-4xl md:text-5xl font-bold text-[#71B254] leading-tight">
                    {recipe.recipeName}
                  </h1>

                  <div className="flex items-center gap-3">
                    <Image
                      src={authorAvatar}
                      alt="ผู้เขียน"
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                    <span className="font-bold text-gray-800 text-lg">
                      {recipe.user?.username ?? "ผู้ไม่ประสงค์ออกนาม"}
                    </span>
                  </div>

                  <div className="flex items-center gap-8 mt-4">
                    <div className="flex items-center gap-4">
                      <svg
                        onClick={toggleFavorite}
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill={recipe.isFavorite ? "#FF0000" : "none"}
                        stroke="#FF0000"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="cursor-pointer hover:scale-110 transition active:scale-95"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      <span className="font-bold text-gray-700 text-lg">
                        {recipe.favoriteCount}
                      </span>

                      <svg
                        onClick={() => setIsCommentOpen(!isCommentOpen)}
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill={isCommentOpen ? "#71B254" : "none"}
                        stroke="#71B254"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="cursor-pointer hover:scale-110 transition active:scale-95"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </div>

                    <div className="flex items-center gap-2">
                      {renderStars(Math.round(recipe.rating))}
                      <span className="font-bold text-gray-800 text-lg ml-2">
                        {recipe.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                    🥕 ส่วนผสม
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {recipe.recipeIngredients.map((ri) => (
                      <span
                        key={ri.id}
                        className="px-3 py-1 border border-[#71B254] rounded-md text-sm text-gray-800 bg-white shadow-sm"
                      >
                        {ri.ingredient.name}
                        {ri.quantity > 0
                          ? ` ${ri.quantity}${translateUnit(ri.unit) ? ` ${translateUnit(ri.unit)}` : ""}`
                          : ""}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                    🍲 วิธีทำ
                  </h3>
                  <div className="border border-[#71B254] rounded-md p-6 bg-white">
                    {instructions.length > 0 ? (
                      <div className="space-y-2 text-gray-800 text-base leading-relaxed">
                        {instructions.map((step, idx) => (
                          <p key={idx}>{step}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        ยังไม่มีวิธีทำสำหรับสูตรนี้
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isCommentOpen && (
              <div className="bg-white border border-[#71B254] rounded-sm p-8 md:p-10 shadow-sm animate-fade-in origin-top">
                <h2 className="text-2xl font-bold text-[#71B254] mb-8">
                  ความคิดเห็น
                </h2>

                {recipe.reviews.length > 0 ? (
                  <div className="flex flex-col gap-6 mb-8">
                    {recipe.reviews.map((review) => (
                      <div key={review.id} className="flex gap-4">
                        <Image
                          src={review.user?.avatarUrl ?? FALLBACK_AVATAR}
                          alt={review.user?.username ?? "ผู้แสดงความคิดเห็น"}
                          width={40}
                          height={40}
                          className="rounded-full object-cover shrink-0"
                        />
                        <div className="flex flex-col w-full">
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-gray-900">
                              {review.isAnonymous
                                ? "ผู้ไม่ประสงค์ออกนาม"
                                : (review.user?.username ?? "ผู้ใช้")}
                            </span>
                            {review.rating > 0 && renderStars(review.rating)}
                          </div>
                          <p className="text-gray-700 mt-1">
                            {review.comment || "ไม่มีความคิดเห็น"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic mb-8">
                    ยังไม่มีความคิดเห็น
                  </p>
                )}

                <div className="border-t border-gray-100 pt-6 flex gap-4 items-start">
                  <div className="flex flex-col w-full gap-3">
                    <span className="font-bold text-gray-900">คุณ</span>
                    <div className="flex items-center gap-4">
                      {renderEmptyStars()}
                    </div>

                    <div className="relative w-full">
                      <input
                        type="text"
                        placeholder="เขียนความคิดเห็น..."
                        className="w-full py-3 pl-4 pr-12 rounded-md bg-[#EAF5E4] border border-[#d2e8c5] text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#71B254] shadow-inner"
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71B254] hover:text-[#5b9642] transition p-1">
                        <svg
                          width="20"
                          height="20"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
