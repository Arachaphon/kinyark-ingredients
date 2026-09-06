"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Anuphan } from "next/font/google";
import useSWR from "swr";
import type { RecipeListResponse } from "@/types/recipes";
import { getAiAuthor } from "@/lib/ai-author";

const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80";
const FALLBACK_AVATAR = "/photo/default-avatar.svg";

const PAGE_SIZE = 10;
const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
});

type Tab = "all" | "user" | "ai";

export default function PostsFeedPage() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

  // Sync initial heart state with the user's real favorites list
  // so /post and /favorites never disagree on favorite status.
  useEffect(() => {
    let isMounted = true;
    fetch("/api/favorites")
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!isMounted || !body?.data) return;
        setFavoritedIds(
          new Set((body.data as Array<{ recipeId: string }>).map((f) => f.recipeId))
        );
      })
      .catch(() => {
        /* not logged in or API unavailable — leave hearts unseeded */
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const { data, error: isError, isLoading } = useSWR<RecipeListResponse>(
    `/api/recipes?page=${page}&limit=${PAGE_SIZE}${activeTab !== "all" ? `&authorType=${activeTab}` : ""}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  const posts = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;
  const loading = isLoading;
  const error = !!isError;

  const fetchPosts = (targetPage: number) => {
    setPage(targetPage);
  };

  // ❤️ ปุ่มหัวใจแบบ Toggle (Optimistic UI): กดบันทึก/ยกเลิกได้ทันที
  function FavoriteHeartButton({
    recipeId,
    favoriteCount,
    initialIsFavorite = false,
  }: {
    recipeId: string;
    favoriteCount: number;
    initialIsFavorite?: boolean;
  }) {
    const [favorite, setFavorite] = useState({
      isFavorite: initialIsFavorite,
      count: favoriteCount,
    });

    const flipFavorite = () => {
      setFavorite((prev) => {
        const isFavorite = !prev.isFavorite;
        return {
          isFavorite,
          count: Math.max(0, prev.count + (isFavorite ? 1 : -1)),
        };
      });
    };

    const toggleFavorite = () => {
      // 1. Optimistic UI: สลับทันที
      flipFavorite();

      // 2. ยิง API; ถ้า server ปฏิเสธ (เช่น 429/500) ให้ revert กลับเพื่อให้ซิงค์เสมอ
      fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
      })
        .then((res) => {
          if (!res.ok) {
            console.warn("Favorite API failed, reverting UI state:", res.status);
            flipFavorite();
          }
        })
        .catch((error) => {
          console.error("Network error toggling favorite:", error);
          flipFavorite();
        });
    };

    return (
      <div
        onClick={toggleFavorite}
        className="flex items-center gap-1.5 cursor-pointer group"
        title={favorite.isFavorite ? "ยกเลิกการบันทึกสูตรนี้" : "บันทึกสูตรนี้"}
      >
        {favorite.isFavorite ? (
          <svg
            width="22"
            height="22"
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
        ) : (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#A5A5A5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:stroke-[#FF0000] transition-colors"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        )}
        <span className="font-bold text-gray-700 text-base group-hover:text-red-500 transition-colors">
          {favorite.count}
        </span>
      </div>
    );
  }

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

      <main className="w-[95%] max-w-[900px] mx-auto px-4 mt-8">
        {/* Category Tabs: ทั้งหมด, ผู้ใช้งาน, สร้างโดย AI */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white/80 backdrop-blur-sm p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-700 font-bold text-sm hidden sm:inline mr-2">หมวดหมู่:</span>
            <button
              onClick={() => {
                setActiveTab("all");
                setPage(1);
              }}
              className={`px-4 sm:px-5 py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                activeTab === "all"
                  ? "bg-[#71B254] text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 hover:text-[#71B254] border border-gray-200"
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => {
                setActiveTab("user");
                setPage(1);
              }}
              className={`px-4 sm:px-5 py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                activeTab === "user"
                  ? "bg-[#71B254] text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 hover:text-[#71B254] border border-gray-200"
              }`}
            >
              โพสต์จากผู้ใช้
            </button>
            <button
              onClick={() => {
                setActiveTab("ai");
                setPage(1);
              }}
              className={`px-4 sm:px-5 py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                activeTab === "ai"
                  ? "bg-[#71B254] text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 hover:text-[#71B254] border border-gray-200"
              }`}
            >
              สร้างโดย AI
            </button>
          </div>

          {data?.meta?.total !== undefined && !loading && (
            <span className="text-xs sm:text-sm text-gray-500 font-medium">
              พบทั้งหมด {data.meta.total} รายการ
            </span>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[#71B254] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 font-medium">กำลังโหลดโพสต์...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white border border-red-300 rounded-xl p-10 text-center shadow-sm">
            <p className="text-lg font-bold text-red-600">
              เกิดข้อผิดพลาดในการโหลดโพสต์
            </p>
            <button
              onClick={() => fetchPosts(1)}
              className="mt-6 px-6 py-2.5 bg-[#71B254] text-white rounded-full text-sm font-bold hover:bg-[#5b9642] transition"
            >
              ลองอีกครั้ง
            </button>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-10 text-center shadow-sm">
            <p className="text-base text-gray-500 italic">
              {activeTab === "ai"
                ? "ยังไม่มีสูตรอาหารที่สร้างโดย AI ในหมวดหมู่นี้"
                : activeTab === "user"
                ? "ยังไม่มีโพสต์สูตรอาหารจากผู้ใช้งานในหมวดหมู่นี้"
                : "ยังไม่มีโพสต์สูตรอาหารในตอนนี้"}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-5">
          {posts.map((post, index) => {
            // ดึงข้อมูลจาก StorePost จริงในฐานข้อมูล
            const storePost = post.storePosts && post.storePosts.length > 0 ? post.storePosts[0] : null;
            const isStoreSet = Boolean(storePost);
            
            const storeName = storePost?.storeName ?? "";
            const sellingPrice = storePost?.sellingPrice ?? 0;

            if (isStoreSet) {
              return (
                <div
                  key={`store-${post.id}`}
                  className="bg-white border border-[#71B254]/60 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow mb-2 animate-fade-in relative"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-[240px] h-[240px] flex-shrink-0 relative">
                      <Image
                        src={storePost?.images[0]?.imageUrl ?? FALLBACK_IMAGE}
                        alt={post.recipeName}
                        fill
                        priority={index === 0}
                        className="object-cover rounded-2xl shadow-sm border border-[#71B254]/20"
                        sizes="(max-width: 768px) 100vw, 240px"
                      />
                    </div>

                    <div className="flex flex-col justify-center gap-4 flex-1 pr-0 md:pr-4 min-w-0">
                      <div className="flex flex-col gap-3">
                        {/* 🏷️ Tag Badge ร้านค้า */}
                        <div className="w-fit bg-[#71B254] text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-sm">
                          <span>ร้าน {storeName}</span>
                        </div>

                        {/* ชื่อเมนู / ชื่อเซ็ทอาหาร */}
                        <h1 className="text-2xl md:text-3xl font-bold text-[#71B254] leading-snug line-clamp-2">
                          เซ็ท {post.recipeName}
                        </h1>
                      </div>

                      {/* ส่วนผสมของสูตรอาหาร หรือ เซ็ทขาย */}
                      {(() => {
                        let ingredientsToDisplay: string[] = [];
                        
                        if (storePost?.setIngredients && Array.isArray(storePost.setIngredients) && storePost.setIngredients.length > 0) {
                          ingredientsToDisplay = storePost.setIngredients.map((i: { name: string }) => i.name).filter(Boolean);
                        } else if (post.recipeIngredients && post.recipeIngredients.length > 0) {
                          ingredientsToDisplay = post.recipeIngredients.map((ri) => ri.ingredient.name);
                        }
                        
                        if (ingredientsToDisplay.length === 0) return null;
                        
                        return (
                          <div className="flex flex-wrap gap-2">
                            {ingredientsToDisplay.slice(0, 5).map((name, idx) => (
                              <span
                                key={idx}
                                className="bg-[#EAF5E4] text-[#5A9240] text-xs font-semibold px-2.5 py-1 rounded-md"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        );
                      })()}

                      {/* 💰 ราคา และ 📞 ช่องทางการติดต่อร้านค้า */}
                      <div className="flex flex-col gap-2 text-left">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-gray-500 shrink-0">
                            ราคาขาย:
                          </span>
                          <span className="text-[#71B254] text-lg font-extrabold">
                            ฿ {sellingPrice} .-
                          </span>
                        </div>

                        <div className="flex items-start gap-2 w-full">
                          <span className="text-xs font-bold text-gray-500 shrink-0 pt-0.5">
                            ติดต่อร้านค้า:
                          </span>
                          <span className="text-xs font-bold text-gray-800 break-words whitespace-pre-wrap flex-1">
                            {storePost?.contactInfo && storePost.contactInfo.trim() !== "" 
                              ? storePost.contactInfo 
                              : "ติดต่อโดยตรง / โทร 081-234-5678"}
                          </span>
                        </div>
                      </div>

                      {/* ข้อมูลผู้โพสต์ */}
                      <div className="flex items-center justify-between flex-wrap gap-4 mt-1">
                        <div className="flex items-center gap-2">
                          <Image
                            src={storePost?.user?.avatarUrl ?? post.user?.avatarUrl ?? FALLBACK_AVATAR}
                            alt={storePost?.user?.username ?? post.user?.username ?? "ผู้เขียน"}
                            width={24}
                            height={24}
                            className="rounded-full object-cover shrink-0 min-w-[24px] min-h-[24px]"
                          />
                          <span className="font-bold text-gray-800 text-base">
                            {storePost?.user?.username ?? post.user?.username ?? "ผู้ไม่ประสงค์ออกนาม"}
                          </span>
                        </div>

                        <Link
                          href={`/recipe/${post.id}`}
                          className="w-fit px-5 py-2 bg-[#71B254] text-white rounded-full text-sm font-bold hover:bg-[#5b9642] transition shadow-sm flex items-center gap-2"
                        >
                          <span>ดูเซ็ทอาหาร</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={post.id}
                className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow mb-2 animate-fade-in"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-[240px] h-[240px] flex-shrink-0 relative">
                    <Image
                      src={post.images[0]?.imageUrl ?? FALLBACK_IMAGE}
                      alt={post.recipeName}
                      fill
                      className="object-cover rounded-2xl shadow-sm"
                      sizes="240px"
                    />
                  </div>

                  <div className="flex flex-col justify-center gap-4 min-w-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-[#71B254] leading-snug line-clamp-2">
                      {post.recipeName}
                    </h1>

                    {post.recipeIngredients && post.recipeIngredients.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.recipeIngredients.slice(0, 5).map((ri) => (
                          <span
                            key={ri.id}
                            className="bg-[#EAF5E4] text-[#5A9240] text-xs font-semibold px-2.5 py-1 rounded-md"
                          >
                            {ri.ingredient.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {(() => {
                        const aiAuthor = getAiAuthor(post.aiProvider);
                        if (aiAuthor) {
                          return (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Image src={aiAuthor.logo} alt={`${aiAuthor.name} logo`} width={24} height={24} className="rounded-full object-cover shrink-0 bg-white border border-gray-100 shadow-sm" />
                              <span className="font-bold text-gray-800 text-base">{aiAuthor.name}</span>
                              <span className="bg-[#E8F0FE] text-[#1A73E8] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#1A73E8]/20">
                                AI Recipe
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div className="flex items-center gap-2">
                            <Image
                              src={post.user?.avatarUrl ?? FALLBACK_AVATAR}
                              alt="ผู้เขียน"
                              width={24}
                              height={24}
                              className="rounded-full object-cover shrink-0 shadow-sm"
                            />
                            <span className="font-bold text-gray-800 text-base">
                              {post.user?.username ?? "ผู้ไม่ประสงค์ออกนาม"}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-6 mt-1">
                      <FavoriteHeartButton
                        recipeId={post.id}
                        favoriteCount={post.favoriteCount}
                        initialIsFavorite={favoritedIds.has(post.id)}
                      />

                      <div className="flex items-center gap-1.5">
                        {renderStars(Math.round(post.rating))}
                        <span className="font-bold text-gray-800 text-base ml-1">
                          {post.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/recipe/${post.id}`}
                      className="w-fit mt-1 px-5 py-2 bg-[#71B254] text-white rounded-full text-sm font-bold hover:bg-[#5b9642] transition shadow-sm"
                    >
                      ดูสูตรอาหาร
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && !error && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <button
              onClick={() => {
                fetchPosts(page - 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={page === 1}
              className="px-5 py-2 border-2 border-[#71B254] text-[#71B254] rounded-full text-sm font-bold hover:bg-[#71B254] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#71B254] transition cursor-pointer disabled:cursor-not-allowed"
            >
              ย้อนกลับ
            </button>
            
            <span className="font-bold text-[#71B254] text-sm">
              หน้า {page} จาก {totalPages}
            </span>

            <button
              onClick={() => {
                fetchPosts(page + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={page === totalPages}
              className="px-5 py-2 border-2 border-[#71B254] text-[#71B254] rounded-full text-sm font-bold hover:bg-[#71B254] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#71B254] transition cursor-pointer disabled:cursor-not-allowed"
            >
              ถัดไป
            </button>
          </div>
        )}
      </main>
    </div>
  );
}