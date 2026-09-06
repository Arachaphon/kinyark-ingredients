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
        /* not logged in or API unavailable */
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

  // ❤️ ปุ่มหัวใจแบบ Toggle (Optimistic UI)
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
      flipFavorite();
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
        className="flex items-center gap-1 cursor-pointer group"
        title={favorite.isFavorite ? "ยกเลิกการบันทึกสูตรนี้" : "บันทึกสูตรนี้"}
      >
        {favorite.isFavorite ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#FF0000" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 group-active:scale-95 transition-transform">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#FF0000] transition-colors">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        )}
        <span className="font-medium text-gray-600 text-sm group-hover:text-red-500 transition-colors">
          {favorite.count}
        </span>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} width="14" height="14" viewBox="0 0 24 24" fill={star <= rating ? "#F1C40F" : "none"} stroke={star <= rating ? "#F1C40F" : "#D1D5DB"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-[#F5EFD7] pb-20 overflow-x-hidden ${anuphan.className}`}>
      <Navbar />

      <main className="w-[95%] max-w-[900px] mx-auto px-4 mt-8">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white/80 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-700 font-bold text-sm hidden sm:inline mr-2">หมวดหมู่:</span>
            <button
              onClick={() => { setActiveTab("all"); setPage(1); }}
              className={`px-4 py-1.5 rounded-md font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                activeTab === "all" ? "bg-[#71B254] text-white shadow-sm" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => { setActiveTab("user"); setPage(1); }}
              className={`px-4 py-1.5 rounded-md font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                activeTab === "user" ? "bg-[#71B254] text-white shadow-sm" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              โพสต์จากผู้ใช้
            </button>
            <button
              onClick={() => { setActiveTab("ai"); setPage(1); }}
              className={`px-4 py-1.5 rounded-md font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                activeTab === "ai" ? "bg-[#71B254] text-white shadow-sm" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
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
          <div className="bg-white border border-red-300 rounded-xl p-8 text-center shadow-sm">
            <p className="text-base font-bold text-red-600">เกิดข้อผิดพลาดในการโหลดโพสต์</p>
            <button onClick={() => fetchPosts(1)} className="mt-4 px-5 py-2 bg-[#71B254] text-white rounded-md text-sm font-bold hover:bg-[#5b9642] transition">
              ลองอีกครั้ง
            </button>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center shadow-sm">
            <p className="text-sm text-gray-500 italic">
              {activeTab === "ai" ? "ยังไม่มีสูตรอาหารที่สร้างโดย AI ในหมวดหมู่นี้" : activeTab === "user" ? "ยังไม่มีโพสต์สูตรอาหารจากผู้ใช้งานในหมวดหมู่นี้" : "ยังไม่มีโพสต์สูตรอาหารในตอนนี้"}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 border border-gray-200 rounded-xl bg-white/50 p-2 sm:p-4 shadow-sm">
          {posts.map((post) => {
            const storePost = post.storePosts && post.storePosts.length > 0 ? post.storePosts[0] : null;
            const isStoreSet = Boolean(storePost);
            const storeName = storePost?.storeName ?? "";
            const sellingPrice = storePost?.sellingPrice ?? 0;

            if (isStoreSet) {
              return (
                <div key={`store-${post.id}`} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow animate-fade-in relative">
                  <div className="flex flex-col sm:flex-row gap-4 h-full">
                    {/* รูปภาพ */}
                    <div className="w-full sm:w-[140px] h-[180px] sm:h-[140px] flex-shrink-0 relative">
                      <Image
                        src={storePost?.images[0]?.imageUrl ?? FALLBACK_IMAGE}
                        alt={post.recipeName}
                        fill
                        className="object-cover rounded-lg border border-gray-100"
                        sizes="(max-width: 640px) 100vw, 140px"
                      />
                    </div>

                    {/* ข้อมูล */}
                    <div className="flex flex-col flex-1 min-w-0 py-0.5">
                      <div className="flex flex-col gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h1 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-1">เซ็ท {post.recipeName}</h1>
                          <span className="bg-[#EAF5E4] text-[#5A9240] text-[10px] font-bold px-2 py-0.5 rounded">เซ็ทอาหารร้านค้า</span>
                        </div>

                        {/* ป้ายวัตถุดิบ */}
                        {(() => {
                          let ingredientsToDisplay: string[] = [];
                          if (storePost?.setIngredients && Array.isArray(storePost.setIngredients) && storePost.setIngredients.length > 0) {
                            ingredientsToDisplay = storePost.setIngredients.map((i: { name: string }) => i.name).filter(Boolean);
                          } else if (post.recipeIngredients && post.recipeIngredients.length > 0) {
                            ingredientsToDisplay = post.recipeIngredients.map((ri) => ri.ingredient.name);
                          }
                          if (ingredientsToDisplay.length === 0) return null;
                          return (
                            <div className="flex flex-wrap gap-1.5">
                              {ingredientsToDisplay.slice(0, 4).map((name, idx) => (
                                <span key={idx} className="bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] text-[10px] font-medium px-2 py-0.5 rounded">
                                  {name}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                      {/* ราคา และการติดต่อ */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mb-2 mt-1">
                        <div><span className="font-medium">ราคา: </span><span className="font-bold text-[#71B254]">฿{sellingPrice}</span></div>
                        <div className="border-l border-gray-200 pl-3 line-clamp-1"><span className="font-medium">ติดต่อ: </span>{storePost?.contactInfo || "N/A"}</div>
                      </div>

                      {/* แถวล่างสุด (หัวใจ, ดาว, คนเขียน, ปุ่ม) */}
                      <div className="flex items-center gap-3 sm:gap-4 mt-auto pt-2 flex-wrap w-full">
                        <FavoriteHeartButton recipeId={post.id} favoriteCount={post.favoriteCount} initialIsFavorite={favoritedIds.has(post.id)} />
                        
                        <div className="flex items-center gap-1">
                          {renderStars(Math.round(post.rating))}
                          <span className="font-bold text-gray-700 text-sm ml-0.5">{post.rating.toFixed(1)}</span>
                        </div>

                        <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3">
                          <Image src={storePost?.user?.avatarUrl ?? post.user?.avatarUrl ?? FALLBACK_AVATAR} alt="author" width={20} height={20} className="rounded-full object-cover" />
                          <span className="font-medium text-gray-500 text-xs truncate max-w-[100px]">{storePost?.user?.username ?? post.user?.username ?? "ร้านค้า"}</span>
                        </div>

                        <Link href={`/recipe/${post.id}`} className="ml-auto px-4 py-1.5 border border-[#71B254] text-[#71B254] rounded-full text-xs font-bold hover:bg-[#71B254] hover:text-white transition">
                          ดูเซ็ทอาหาร
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
                <div className="flex flex-col sm:flex-row gap-4 h-full">
                  {/* รูปภาพ */}
                  <div className="w-full sm:w-[140px] h-[180px] sm:h-[140px] flex-shrink-0 relative">
                    <Image
                      src={post.images[0]?.imageUrl ?? FALLBACK_IMAGE}
                      alt={post.recipeName}
                      fill
                      className="object-cover rounded-lg border border-gray-100"
                      sizes="(max-width: 640px) 100vw, 140px"
                    />
                  </div>

                  {/* ข้อมูล */}
                  <div className="flex flex-col flex-1 min-w-0 py-0.5">
                    {/* แถวบน: ชื่อ และ ป้ายกำกับ */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h1 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-1">{post.recipeName}</h1>
                      <span className="bg-[#EAF5E4] text-[#5A9240] text-[10px] font-bold px-2 py-0.5 rounded">สูตรอาหาร</span>
                      
                      {(() => {
                        const aiAuthor = getAiAuthor(post.aiProvider);
                        if (aiAuthor) {
                          return <span className="bg-[#E8F0FE] text-[#1A73E8] text-[10px] font-bold px-2 py-0.5 rounded border border-[#1A73E8]/10">AI Recipe</span>;
                        }
                        return <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded">สาธารณะ</span>;
                      })()}
                    </div>

                    {/* ป้ายวัตถุดิบ */}
                    {post.recipeIngredients && post.recipeIngredients.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {post.recipeIngredients.slice(0, 5).map((ri) => (
                          <span key={ri.id} className="bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] text-[10px] font-medium px-2 py-0.5 rounded">
                            {ri.ingredient.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* แถวล่างสุด (หัวใจ, ดาว, คนเขียน, ปุ่ม) */}
                    <div className="flex items-center gap-3 sm:gap-4 mt-auto pt-2 flex-wrap w-full">
                      <FavoriteHeartButton recipeId={post.id} favoriteCount={post.favoriteCount} initialIsFavorite={favoritedIds.has(post.id)} />
                      
                      <div className="flex items-center gap-1">
                        {renderStars(Math.round(post.rating))}
                        <span className="font-bold text-gray-700 text-sm ml-0.5">{post.rating.toFixed(1)}</span>
                      </div>

                      <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3">
                        {(() => {
                          const aiAuthor = getAiAuthor(post.aiProvider);
                          if (aiAuthor) {
                            return (
                              <>
                                <Image src={aiAuthor.logo} alt="ai" width={20} height={20} className="rounded-full object-cover bg-white border border-gray-100" />
                                <span className="font-medium text-gray-500 text-xs">{aiAuthor.name}</span>
                              </>
                            );
                          }
                          return (
                            <>
                              <Image src={post.user?.avatarUrl ?? FALLBACK_AVATAR} alt="author" width={20} height={20} className="rounded-full object-cover border border-gray-100" />
                              <span className="font-medium text-gray-500 text-xs truncate max-w-[100px]">{post.user?.username ?? "ผู้เขียน"}</span>
                            </>
                          );
                        })()}
                      </div>

                      <Link href={`/recipe/${post.id}`} className="ml-auto px-4 py-1.5 border border-[#71B254] text-[#71B254] rounded-full text-xs font-bold hover:bg-[#71B254] hover:text-white transition">
                        ดูสูตรอาหาร
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && !error && totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-8 mb-6">
            <button
              onClick={() => { fetchPosts(page - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              disabled={page === 1}
              className="px-4 py-1.5 border border-[#71B254] text-[#71B254] rounded-md text-xs font-bold hover:bg-[#71B254] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#71B254] transition cursor-pointer disabled:cursor-not-allowed"
            >
              ย้อนกลับ
            </button>
            <span className="font-bold text-gray-600 text-sm">
              หน้า {page} / {totalPages}
            </span>
            <button
              onClick={() => { fetchPosts(page + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              disabled={page === totalPages}
              className="px-4 py-1.5 border border-[#71B254] text-[#71B254] rounded-md text-xs font-bold hover:bg-[#71B254] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#71B254] transition cursor-pointer disabled:cursor-not-allowed"
            >
              ถัดไป
            </button>
          </div>
        )}
      </main>
    </div>
  );
}