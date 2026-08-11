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

type Tab = "All" | "Publish" | "Draft" | "StoreSet";

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
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("USER");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    recipeId: string | null;
    storePostId: string | null;
  }>({
    isOpen: false,
    recipeId: null,
    storePostId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

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
      if (body.meta.userId) {
        setMyUserId(body.meta.userId);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteRecipeTrigger = (recipeId: string) => {
    setDeleteModal({ isOpen: true, recipeId, storePostId: null });
  };

  const handleDeleteStorePostTrigger = (storePostId: string) => {
    setDeleteModal({ isOpen: true, recipeId: null, storePostId });
  };

  const handleConfirmDelete = async () => {
    const { recipeId, storePostId } = deleteModal;
    if (!recipeId && !storePostId) return;

    setIsDeleting(true);
    try {
      const url = recipeId ? `/api/recipes/${recipeId}` : `/api/store-posts/${storePostId}`;
      const res = await fetch(url, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteModal({ isOpen: false, recipeId: null, storePostId: null });
        fetchRecipes();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "เกิดข้อผิดพลาดในการลบ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    // Run both fetches in parallel — no sequential wait
    Promise.all([
      fetchRecipes(),
      fetch('/api/auth/me')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.user?.role) setUserRole(data.user.role);
        })
        .catch(() => {}),
    ]);
  }, [fetchRecipes]);

  const myRecipes = recipes.filter((r) => r.user?.id === myUserId);
  const publishCount = myRecipes.filter((r) => r.visibility === "public" || r.visibility === "protected" || r.visibility === "private").length;
  const draftCount = myRecipes.filter((r) => r.visibility === "draft").length;
  const storeSetCount = recipes.reduce(
    (acc, r) => acc + (r.storePosts?.length || 0), 0
  );

  // allCount shows unique items. Include store posts only for store/admin users.
  const isStoreUser = userRole === "STORE" || userRole === "ADMIN";
  const allCount = myRecipes.length + (isStoreUser ? storeSetCount : 0);

  const displayedRecipes = recipes.filter((recipe) => {
    if (activeTab === "All") return true;
    
    // For publish and draft, only show if it's MY recipe and has the right visibility
    const isMyRecipe = recipe.user?.id === myUserId;
    if (activeTab === "Publish") return isMyRecipe && (recipe.visibility === "public" || recipe.visibility === "protected" || recipe.visibility === "private");
    if (activeTab === "Draft") return isMyRecipe && recipe.visibility === "draft";
    
    if (activeTab === "StoreSet")
      return recipe.storePosts && recipe.storePosts.length > 0;
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
              {/* Tabs */}
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

                {(userRole === "STORE" || userRole === "ADMIN") && (
                <button
                  onClick={() => setActiveTab("StoreSet")}
                  className={`px-5 py-2 rounded-md font-medium transition ${
                    activeTab === "StoreSet"
                      ? "bg-[#71B254] text-white border border-[#71B254]"
                      : "bg-white text-gray-500 border border-gray-300 hover:border-[#71B254] hover:text-[#71B254]"
                  }`}
                >
                  เซ็ทอาหารร้านค้า ({storeSetCount})
                </button>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {displayedRecipes.length > 0 ? (
                  displayedRecipes.flatMap((recipe) => {
                    const storePosts = recipe.storePosts ?? [];
                    const isStoreSet = storePosts.length > 0;
                    const isMyRecipe = recipe.user?.id === myUserId;

                    // การ์ดสูตรอาหาร (แสดงเสมอในทุก tab ยกเว้น StoreSet, และแสดงเฉพาะสูตรที่ตนเองเป็นเจ้าของ)
                    const recipeCard = (activeTab !== "StoreSet" && isMyRecipe) ? (
                      <div
                        key={`recipe-${recipe.id}`}
                        className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-xl bg-white border border-gray-200 transition-colors hover:border-[#71B254]"
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
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-xl font-bold text-gray-900">
                                {recipe.recipeName}
                              </h3>
                              <span className="text-xs font-extrabold bg-[#EAF5E4] text-[#5A9240] px-2.5 py-0.5 rounded-full">
                                สูตรอาหาร
                              </span>
                              {isStoreSet && (
                                <span className="text-xs font-extrabold text-white bg-[#71B254] px-2.5 py-0.5 rounded-full">
                                  มีเซ็ทอาหารร้านค้า
                                </span>
                              )}
                              <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-sm ${
                                  recipe.visibility === "public"
                                    ? "bg-[#EAF5E4] text-[#5A9240]"
                                    : recipe.visibility === "protected"
                                      ? "bg-[#FEF9C3] text-[#A16207]"
                                      : recipe.visibility === "private"
                                        ? "bg-[#FDE8E8] text-[#C0392B]"
                                        : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {recipe.visibility === "public" ? "สาธารณะ" : (recipe.visibility === "protected" ? "สาธารณะจำกัดสิทธิ์" : (recipe.visibility === "private" ? "ส่วนตัว" : "ฉบับร่าง"))}
                              </span>
                            </div>

                            {recipe.recipeIngredients && recipe.recipeIngredients.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {recipe.recipeIngredients.slice(0, 5).map((ri) => (
                                  <span
                                    key={ri.id}
                                    className="bg-[#EAF5E4] text-[#5A9240] text-xs font-semibold px-2.5 py-1 rounded-sm"
                                  >
                                    {ri.ingredient.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-5 mt-5 text-gray-500 text-sm font-medium">
                            <div className="flex items-center gap-1.5">
                              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                              </svg>
                              <span>{recipe.favoriteCount}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <svg width="18" height="18" fill="#F1C40F" stroke="#F1C40F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                              </svg>
                              <span>{recipe.rating.toFixed(1)}</span>
                            </div>
                            <div className="text-gray-400">เผยแพร่เมื่อ {formatThaiDate(recipe.createdAt)}</div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full md:w-36 shrink-0 mt-4 md:mt-0">
                          <Link
                            href={`/my-recipe/edit/${recipe.id}`}
                            className="w-full text-center py-1.5 px-4 border border-[#F39C12] text-[#F39C12] rounded-full text-sm font-bold hover:bg-orange-50 transition block"
                          >
                            แก้ไข
                          </Link>
                          <button 
                            onClick={() => handleDeleteRecipeTrigger(recipe.id)}
                            className="w-full py-1.5 px-4 border border-[#E74C3C] text-[#E74C3C] rounded-full text-sm font-bold hover:bg-red-50 transition"
                          >
                            ลบ
                          </button>
                          <Link
                            href={`/recipe/${recipe.id}`}
                            className="w-full text-center py-1.5 px-4 border border-[#71B254] text-[#71B254] rounded-full text-sm font-bold hover:bg-[#EAF5E4] transition block"
                          >
                            ดูสูตรอาหาร
                          </Link>
                        </div>
                      </div>
                    ) : null;

                    // การ์ดเซ็ทอาหาร (แสดงถ้ามี storePost และ tab ไม่ใช่ Publish/Draft ของสูตรปกติ)
                    const storeCards = (activeTab === "All" || activeTab === "StoreSet") && isStoreSet
                      ? storePosts.map((sp) => (
                          <div
                            key={`store-${sp.id}`}
                            className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-xl bg-white border border-gray-200 transition-colors hover:border-[#71B254] relative"
                          >
                            <div className="w-full md:w-36 h-36 flex-shrink-0 relative">
                              <Image
                                src={sp.images?.[0]?.imageUrl ?? recipe.images[0]?.imageUrl ?? FALLBACK_IMAGE}
                                alt={sp.storeName}
                                fill
                                className="object-cover rounded-lg"
                                sizes="144px"
                              />
                            </div>

                            <div className="flex-grow flex flex-col justify-between w-full">
                              <div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <h3 className="text-xl font-bold text-[#5A9240]">
                                    เซ็ท {recipe.recipeName || "(สูตรอาหารถูกลบแล้ว)"}
                                  </h3>
                                  <span className="text-xs font-extrabold text-white bg-[#71B254] px-2.5 py-0.5 rounded-full">
                                    เซ็ทอาหารร้านค้า
                                  </span>
                                  <span
                                    className={`text-xs font-semibold px-2.5 py-1 rounded-sm ${
                                      sp.visibility === "public"
                                        ? "bg-[#EAF5E4] text-[#5A9240]"
                                        : sp.visibility === "protected"
                                          ? "bg-[#FEF9C3] text-[#A16207]"
                                          : sp.visibility === "private"
                                            ? "bg-[#FDE8E8] text-[#C0392B]"
                                            : "bg-gray-100 text-gray-500"
                                    }`}
                                  >
                                    {sp.visibility === "public" ? "สาธารณะ" : (sp.visibility === "protected" ? "สาธารณะจำกัดสิทธิ์" : (sp.visibility === "private" ? "ส่วนตัว" : "ฉบับร่าง"))}
                                  </span>
                                </div>
                                <div className="flex items-center flex-wrap gap-3 mt-1">
                                  <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                                    <div className="w-5 h-5 relative shrink-0">
                                      <Image
                                        src={sp.user?.avatarUrl ?? recipe.user?.avatarUrl ?? "/images/default-avatar.png"}
                                        alt={sp.user?.username ?? recipe.user?.username ?? "User"}
                                        fill
                                        className="rounded-full object-cover"
                                        sizes="20px"
                                      />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700">
                                      {sp.user?.username ?? recipe.user?.username}
                                    </span>
                                  </div>
                                  <span className="text-sm font-bold text-gray-700">{sp.storeName}</span>
                                  <span className="text-sm font-extrabold text-[#5A9240]">฿ {sp.sellingPrice} .-</span>
                                </div>
                                {sp.storeDescription && (
                                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{sp.storeDescription}</p>
                                )}
                                <div className="text-gray-400 mt-2">เผยแพร่เมื่อ {formatThaiDate(sp.createdAt)}</div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 w-full md:w-36 shrink-0 mt-4 md:mt-0">
                              {!recipe.id.startsWith("orphan-") && (
                                <Link
                                  href={`/my-recipe/edit/${recipe.id}?type=set`}
                                  className="w-full text-center py-1.5 px-4 border border-[#F39C12] text-[#F39C12] rounded-full text-sm font-bold hover:bg-orange-50 transition block"
                                >
                                  แก้ไข
                                </Link>
                              )}
                              <button 
                                onClick={() => handleDeleteStorePostTrigger(sp.id)}
                                className="w-full py-1.5 px-4 border border-[#E74C3C] text-[#E74C3C] rounded-full text-sm font-bold hover:bg-red-50 transition"
                              >
                                ลบ
                              </button>
                              {recipe.id.startsWith("orphan-") ? (
                                <span className="w-full text-center py-1.5 px-4 border border-gray-300 text-gray-400 rounded-full text-xs font-bold bg-gray-50 cursor-not-allowed block">
                                  สูตรอาหารเดิมถูกลบแล้ว
                                </span>
                              ) : (
                                <Link
                                  href={`/recipe/${recipe.id}`}
                                  className="w-full text-center py-1.5 px-4 border border-[#71B254] text-[#71B254] rounded-full text-sm font-bold hover:bg-[#EAF5E4] transition block"
                                >
                                  ดูเซ็ทอาหาร
                                </Link>
                              )}
                            </div>
                          </div>
                        ))
                      : [];

                    return [recipeCard, ...storeCards].filter(Boolean);
                  })
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

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#71B254]/30 rounded-[24px] p-6 max-w-[420px] w-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-scale-in text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">ยืนยันการลบ</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              คุณต้องการลบสูตรอาหาร/เซ็ทนี้ใช่หรือไม่? การลบนี้จะเป็นการลบอย่างถาวรและไม่สามารถกู้คืนข้อมูลได้
            </p>
            <div className="flex items-center gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteModal({ isOpen: false, recipeId: null, storePostId: null })}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition duration-200 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-3 bg-[#E74C3C] hover:bg-[#c0392b] text-white font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isDeleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>กำลังลบ...</span>
                  </>
                ) : (
                  <span>ยืนยันการลบ</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

