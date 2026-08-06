/* eslint-disable @next/next/no-img-element */
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
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80";
const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1531123897727-8f129e120a4?auto=format&fit=crop&w=150&q=80";

const PAGE_SIZE = 4;

export default function PostsFeedPage() {
  const [posts, setPosts] = useState<RecipeListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({});

  const fetchPosts = useCallback(async (targetPage: number, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(false);

    try {
      const res = await fetch(
        `/api/recipes?page=${targetPage}&limit=${PAGE_SIZE}`
      );
      if (!res.ok) {
        setError(true);
        return;
      }
      const body = (await res.json()) as RecipeListResponse;
      setPosts((prev) =>
        append ? [...prev, ...body.data] : body.data
      );
      setTotalPages(body.meta.totalPages);
      setPage(targetPage);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  const handleSelectImage = (postId: string, index: number) => {
    setActiveImageIndex((prev) => ({
      ...prev,
      [postId]: index,
    }));
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

  return (
    <div
      className={`min-h-screen bg-[#F5EFD7] pb-20 overflow-x-hidden ${anuphan.className}`}
    >
      <Navbar />

      <main className="w-[95%] max-w-[1000px] mx-auto px-4 mt-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 border-4 border-[#71B254] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 font-medium">กำลังโหลดโพสต์...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white border border-red-300 rounded-sm p-12 text-center shadow-sm">
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
          <div className="bg-white border border-gray-200 rounded-sm p-12 text-center shadow-sm">
            <p className="text-lg text-gray-500 italic">
              ยังไม่มีโพสต์สูตรอาหารในตอนนี้
            </p>
          </div>
        )}

        <div className="flex flex-col gap-8">
          {posts.map((post) => {
            // ดึงข้อมูลจาก StorePost จริงในฐานข้อมูล
            const storePost = post.storePosts && post.storePosts.length > 0 ? post.storePosts[0] : null;
            const isStoreSet = Boolean(storePost);
            
            const storeName = storePost?.storeName ?? "";
            const sellingPrice = storePost?.sellingPrice ?? 0;

            if (isStoreSet) {
              return (
                <div
                  key={`store-${post.id}`}
                  className="bg-white border border-[#71B254] rounded-sm p-8 shadow-md mb-4 animate-fade-in relative"
                >


                  <div className="flex flex-col md:flex-row gap-10">
                    <div className="w-full md:w-[380px] h-[350px] flex-shrink-0 relative">
                      <Image
                        src={storePost?.images[0]?.imageUrl ?? FALLBACK_IMAGE}
                        alt={post.recipeName}
                        fill
                        className="object-cover rounded-3xl shadow-md border border-[#71B254]/20"
                        sizes="(max-width: 768px) 100vw, 380px"
                      />
                    </div>

                    <div className="flex flex-col justify-center gap-6 flex-1 pr-4">
                      <div className="flex flex-col gap-4">
                        {/* 🏷️ Tag Badge ร้านค้า */}
                        <div className="w-fit bg-[#71B254] text-white text-sm font-extrabold px-4 py-1.5 rounded-full shadow-sm">
                          <span>ร้าน {storeName}</span>
                        </div>

                        {/* ชื่อเมนู / ชื่อเซ็ทอาหาร */}
                        <h1 className="text-4xl md:text-5xl font-bold text-[#71B254] leading-tight">
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
                                className="bg-[#EAF5E4] text-[#5A9240] text-sm font-semibold px-3 py-1 rounded-md"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        );
                      })()}

                      {/* 💰 ราคา และ 📞 ช่องทางการติดต่อร้านค้า (แถวเดียวกัน) */}
                      <div className="flex flex-col gap-3 text-left">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-bold text-gray-500 shrink-0">
                            ราคาขาย:
                          </span>
                          <span className="text-[#71B254] text-xl font-extrabold">
                            ฿ {sellingPrice} .-
                          </span>
                        </div>

                        <div className="flex items-start gap-2 w-full">
                          <span className="text-sm font-bold text-gray-500 shrink-0 pt-0.5">
                            ติดต่อร้านค้า:
                          </span>
                          <span className="text-sm font-bold text-gray-800 break-words whitespace-pre-wrap flex-1">
                            {storePost?.contactInfo && storePost.contactInfo.trim() !== "" 
                              ? storePost.contactInfo 
                              : "ติดต่อโดยตรง / โทร 081-234-5678"}
                          </span>
                        </div>
                      </div>

                      {/* ข้อมูลผู้โพสต์ */}
                      <div className="flex items-center gap-3">
                        <Image
                          src={storePost?.user?.avatarUrl ?? post.user?.avatarUrl ?? FALLBACK_AVATAR}
                          alt={storePost?.user?.username ?? post.user?.username ?? "ผู้เขียน"}
                          width={32}
                          height={32}
                          className="rounded-full object-cover shrink-0 min-w-[32px] min-h-[32px]"
                        />
                        <span className="font-bold text-gray-800 text-lg">
                          {storePost?.user?.username ?? post.user?.username ?? "ผู้ไม่ประสงค์ออกนาม"}
                        </span>
                      </div>

                      <div className="flex items-center mt-2">
                        <Link
                          href={`/recipe/${post.id}`}
                          className="w-fit px-6 py-2.5 bg-[#71B254] text-white rounded-full text-sm font-bold hover:bg-[#5b9642] transition shadow-md flex items-center gap-2"
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
                className="bg-white border-2 border-white rounded-sm p-8 shadow-sm mb-4 animate-fade-in"
              >
                <div className="flex flex-col md:flex-row gap-10">
                  <div className="w-full md:w-[350px] h-[350px] flex-shrink-0 relative">
                    <Image
                      src={post.images[0]?.imageUrl ?? FALLBACK_IMAGE}
                      alt={post.recipeName}
                      fill
                      className="object-cover rounded-3xl shadow-md"
                      sizes="350px"
                    />
                  </div>

                  <div className="flex flex-col justify-center gap-6">
                    <h1 className="text-4xl md:text-5xl font-bold text-[#71B254] leading-tight">
                      {post.recipeName}
                    </h1>

                    {post.recipeIngredients && post.recipeIngredients.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.recipeIngredients.slice(0, 5).map((ri) => (
                          <span
                            key={ri.id}
                            className="bg-[#EAF5E4] text-[#5A9240] text-sm font-semibold px-3 py-1 rounded-md"
                          >
                            {ri.ingredient.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Image
                        src={post.user?.avatarUrl ?? FALLBACK_AVATAR}
                        alt="ผู้เขียน"
                        width={32}
                        height={32}
                        className="rounded-full object-cover shrink-0"
                      />
                      <span className="font-bold text-gray-800 text-lg">
                        {post.user?.username ?? "ผู้ไม่ประสงค์ออกนาม"}
                      </span>
                    </div>

                    <div className="flex items-center gap-8 mt-4">
                      <div className="flex items-center gap-2">
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="#FF0000"
                          stroke="#FF0000"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span className="font-bold text-gray-700 text-lg">
                          {post.favoriteCount}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {renderStars(Math.round(post.rating))}
                        <span className="font-bold text-gray-800 text-lg ml-2">
                          {post.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/recipe/${post.id}`}
                      className="w-fit px-6 py-2.5 bg-[#71B254] text-white rounded-full text-sm font-bold hover:bg-[#5b9642] transition shadow-sm"
                    >
                      ดูสูตรอาหาร
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && !error && page < totalPages && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => fetchPosts(page + 1, true)}
              disabled={loadingMore}
              className="px-8 py-3 border-2 border-[#71B254] text-[#71B254] rounded-full text-sm font-bold hover:bg-[#71B254] hover:text-white transition disabled:opacity-50"
            >
              {loadingMore ? "กำลังโหลด..." : "โหลดเพิ่มเติม"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
