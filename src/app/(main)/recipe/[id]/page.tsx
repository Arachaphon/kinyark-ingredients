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

function ImageCarousel({
  images,
  altText,
  themeColor = "#71B254",
}: {
  images: Array<{ id: string; imageUrl: string }>;
  altText: string;
  themeColor?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* 🖼️ กล่องแสดงรูปภาพสไลด์หลัก */}
      <div className="relative w-full h-72 sm:h-80 md:h-96 rounded-2xl overflow-hidden shadow-md border border-black/10 group bg-black/5">
        <Image
          src={images[currentIndex]?.imageUrl || FALLBACK_IMAGE}
          alt={`${altText} image ${currentIndex + 1}`}
          fill
          className="object-cover transition-all duration-300"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />

        {/* ปุ่มเลื่อนซ้าย-ขวา (แสดงเมื่อมีภาพมากกว่า 1 ภาพ) */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm opacity-90 group-hover:opacity-100 hover:bg-black/70 hover:scale-110 transition z-10 shadow-md"
              aria-label="รูปก่อนหน้า"
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
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm opacity-90 group-hover:opacity-100 hover:bg-black/70 hover:scale-110 transition z-10 shadow-md"
              aria-label="รูปถัดไป"
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
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </>
        )}

        {/* Badge บอกจำนวนรูปมุมขวาบน */}
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm shadow-sm z-10">
          {currentIndex + 1} / {images.length}
        </div>

        {/* ปุ่มจุดบอกตำแหน่งรูปหน้า (Dots indicator) */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-black/30 px-3 py-1 rounded-full backdrop-blur-xs">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all rounded-full ${
                  idx === currentIndex
                    ? "w-5 h-2 bg-white shadow-sm"
                    : "w-2 h-2 bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`ไปที่รูปที่ ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 🔍 แถบรูปย่อเลื่อนเลือกภาพ (Thumbnails) */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                idx === currentIndex
                  ? "border-[#16A34A] scale-105 shadow-sm"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
              style={{
                borderColor: idx === currentIndex ? themeColor : "transparent",
              }}
            >
              <Image
                src={img.imageUrl}
                alt={`Thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
                prev.favoriteCount + (favorited ? 1 : -1),
              ),
            }
          : prev,
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
          <div className="bg-white border border-gray-200 rounded-sm p-12 text-center">
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
            {/* 🏪 หากสูตรนี้เป็นเซ็ทอาหารของร้านค้า ให้แสดงการ์ดรายละเอียดเซ็ทอาหารร้านค้าด้านบน */}
            {recipe.storePosts &&
              recipe.storePosts.length > 0 &&
              (() => {
                const storePost = recipe.storePosts[0];
                const storeName = storePost.storeName || "ร้านค้า";
                const sellingPrice = storePost.sellingPrice || 0;
                const storeDescription =
                  storePost.storeDescription ||
                  "เซ็ทอาหารพิเศษจากทางร้าน คัดสรรวัตถุดิบสดใหม่พร้อมปรุง";
                const storeImages =
                  storePost.images && storePost.images.length > 0
                    ? storePost.images
                    : recipe.images && recipe.images.length > 0
                      ? recipe.images
                      : [{ id: "fallback", imageUrl: coverImage }];
                const storeVideos =
                  storePost.videos && storePost.videos.length > 0
                    ? storePost.videos
                    : recipe.videos || [];
                const storeUserAvatar =
                  storePost.user?.avatarUrl ?? FALLBACK_AVATAR;
                const storeUsername = storePost.user?.username ?? "store";

                return (
                  <div className="bg-white border-2 border-[#16A34A] rounded-sm p-8 relative mb-6 animate-fade-in flex flex-col gap-8">
                    <div className="absolute top-4 right-4 bg-[#16A34A] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 z-10">
                      <span>รายละเอียดเซ็ทอาหารร้านค้า</span>
                    </div>

                    {/* 1️⃣ ส่วนบนสุด: การ์ดโปรไฟล์ร้านค้า/ผู้ขายฝั่งซ้าย + รายละเอียดเซ็ทอาหารฝั่งขวา + รายละเอียดเพิ่มเติม */}
                    <div className="flex flex-col gap-4 mt-12 md:mt-6 w-full">
                      <div className="flex flex-col gap-6 bg-white p-6 rounded-2xl border border-[#16A34A]/30 w-full">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full">
                          {/* 👈 คอลัมน์ซ้าย: การ์ดโปรไฟล์ร้านค้า/เจ้าของสูตร (ไม่มีกรอบและพื้นหลัง) */}
                          <div className="flex flex-col items-center gap-2 px-5 py-4 rounded-xl flex-shrink-0 min-w-[140px]">
                            <div className="w-16 h-16 relative">
                              <Image
                                src={storeUserAvatar}
                                alt={storeName}
                                fill
                                className="rounded-full object-cover border-2 border-[#16A34A]"
                              />
                            </div>
                            <span className="text-xs font-extrabold text-white bg-[#16A34A] px-2.5 py-0.5 rounded-full">
                              ร้านค้า
                            </span>
                            <span className="font-extrabold text-[#15803D] text-sm text-center leading-tight">
                              {storeName}
                            </span>
                            <span className="text-xs text-gray-500 text-center font-medium">
                              @{storeUsername}
                            </span>
                          </div>

                          {/* 👉 คอลัมน์ขวา: ชื่อเซ็ทอาหาร ราคา ช่องทางติดต่อ และรายละเอียด */}
                          <div className="flex flex-col justify-between flex-1 gap-4 w-full text-center sm:text-left py-1">
                            <div>
                              <span className="text-xs font-extrabold text-[#16A34A] tracking-wide uppercase bg-[#DCFCE7] px-3 py-1 rounded-md">
                                เซ็ทอาหารพร้อมปรุง
                              </span>
                              <h1 className="text-3xl md:text-4xl font-bold text-[#15803D] leading-tight mt-2">
                                เซ็ท {recipe.recipeName}
                              </h1>
                            </div>

                            {/* ราคา และ ช่องทางการติดต่อร้านค้า */}
                            <div className="flex flex-col gap-3 text-left pt-1">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs font-bold text-gray-500 shrink-0">
                                  ราคาขาย:
                                </span>
                                <span className="text-[#16A34A] text-2xl font-extrabold">
                                  ฿ {sellingPrice} .-
                                </span>
                              </div>

                              <div className="flex flex-col gap-0.5 text-left w-full">
                                <span className="text-xs font-bold text-gray-500">
                                  ช่องทางการติดต่อร้านค้า:
                                </span>
                                <span className="text-sm font-bold text-gray-800 break-words whitespace-pre-wrap">
                                  {storePost.contactInfo &&
                                  storePost.contactInfo.trim() !== ""
                                    ? storePost.contactInfo
                                    : "ติดต่อทางร้านโดยตรง / โทร 081-234-5678"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {storeDescription && (
                          <div className="border-t border-[#16A34A]/20 pt-4 w-full">
                            <p className="text-sm text-gray-700 leading-relaxed text-left">
                              {storeDescription}
                            </p>
                          </div>
                        )}

                        {storePost.setIngredients &&
                          Array.isArray(storePost.setIngredients) &&
                          storePost.setIngredients.length > 0 && (
                            <div className="border-t border-[#16A34A]/20 pt-4 w-full">
                              <h4 className="text-sm font-bold text-[#15803D] mb-3 flex items-center gap-2">
                                <svg
                                  width="18"
                                  height="18"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M9 11l3 3L22 4"></path>
                                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                                </svg>
                                วัตถุดิบในเซ็ทอาหารนี้
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {storePost.setIngredients.map(
                                  (ing: { name: string; quantity: string | number; unit: string }, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2 text-sm text-gray-700 bg-white/50 p-2 rounded-md border border-[#16A34A]/10"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] shrink-0"></span>
                                      <span className="font-semibold flex-1 truncate">
                                        {ing.name}
                                      </span>
                                      <span className="text-gray-500 shrink-0 font-medium">
                                        {ing.quantity}{" "}
                                        {translateUnit(ing.unit)
                                          ? translateUnit(ing.unit)
                                          : ""}
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* 2️⃣ แถวรูปภาพและวิดีโอ (จัดวางเคียงข้างกัน 50/50 สไลด์รูปภาพสไลเดอร์) */}
                    {((storeImages && storeImages.length > 0) ||
                      (storeVideos && storeVideos.length > 0)) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full">
                        {/* 🖼️ ฝั่งซ้าย: สไลเดอร์รูปภาพเซ็ทอาหาร */}
                        {storeImages && storeImages.length > 0 ? (
                          <div className="flex flex-col gap-3 w-full">
                            <p className="text-xs font-bold text-[#16A34A]">
                              รูปภาพเซ็ทอาหาร:
                            </p>
                            <ImageCarousel
                              images={storeImages}
                              altText={storeName}
                              themeColor="#16A34A"
                            />
                          </div>
                        ) : (
                          <div className="hidden lg:block" />
                        )}

                        {/* 🎥 ฝั่งขวา: วิดีโอแนะนำเซ็ทอาหาร */}
                        {storeVideos && storeVideos.length > 0 && (
                          <div className="flex flex-col gap-3 w-full">
                            <p className="text-xs font-bold text-[#16A34A]">
                              วิดีโอแนะนำเซ็ทอาหาร:
                            </p>
                            <div className="flex flex-col gap-3 w-full">
                              {storeVideos.map((vid, idx) => (
                                <div
                                  key={vid.id || idx}
                                  className="w-full h-72 sm:h-80 md:h-96 rounded-2xl overflow-hidden border border-black/10 bg-black flex items-center justify-center"
                                >
                                  <video
                                    src={vid.videoUrl}
                                    controls
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3️⃣ แผนที่พิกัดร้านค้าอยู่ล่างสุดเต็มแถว (ขนาดสี่เหลี่ยมผืนผ้าแนวนอน) */}
                    <div className="flex flex-col gap-2 bg-white p-5 rounded-2xl border border-[#BBF7D0] w-full">
                      <p className="text-xs font-bold text-[#16A34A] flex items-center justify-between">
                        <span>
                          พิกัดและแผนที่ร้านค้า:{" "}
                          {storePost.storeLocation
                            ? `(${storePost.storeLocation})`
                            : ""}
                        </span>
                        {storePost.storeLocation && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              storePost.storeLocation,
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#16A34A] hover:underline"
                          >
                            <span>เปิดนำทางใน Google Maps</span>
                            <span>↗</span>
                          </a>
                        )}
                      </p>
                      <div className="w-full h-64 md:h-72 rounded-xl overflow-hidden border border-[#BBF7D0] relative bg-white mt-1">
                        <iframe
                          title="Store Location Map"
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(
                            storePost.storeLocation ||
                              storeName ||
                              "มหาวิทยาลัยพะเยา",
                          )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* 📖 รายละเอียดสูตรอาหาร */}
            <div className="bg-white border border-[#71B254] rounded-sm p-8 relative mb-6 flex flex-col gap-8">
              {/* 🏷️ Badge ขวามือบนสุดของการ์ดสูตรอาหาร */}
              <div className="absolute top-4 right-4 bg-[#71B254] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 z-10">
                <span>รายละเอียดสูตรอาหาร</span>
              </div>

              {/* 1️⃣ ส่วนบนสุด: การ์ดโปรไฟล์ฝั่งซ้าย + ข้อมูลชื่อเมนูและส่วน Engage ฝั่งขวา */}
              <div className="flex flex-col gap-4 mt-12 md:mt-6 w-full">
                <div className="flex flex-col gap-6 bg-white/90 p-6 rounded-2xl border border-[#71B254]/30 w-full">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full">
                    {/* 👈 คอลัมน์ซ้าย: การ์ดโปรไฟล์ผู้เขียน (ไม่มีกรอบและพื้นหลัง) */}
                    <div className="flex flex-col items-center gap-2 px-5 py-4 rounded-xl flex-shrink-0 min-w-[140px]">
                      <div className="w-16 h-16 relative">
                        <Image
                          src={authorAvatar}
                          alt="ผู้เขียน"
                          fill
                          className="rounded-full object-cover border-2 border-[#71B254]"
                        />
                      </div>
                      <span className="text-xs font-extrabold text-white bg-[#71B254] px-2.5 py-0.5 rounded-full">
                        เจ้าของสูตร
                      </span>
                      <span className="font-extrabold text-gray-800 text-sm text-center leading-tight">
                        {recipe.user?.username ?? "ผู้ไม่ประสงค์ออกนาม"}
                      </span>
                    </div>

                    {/* 👉 คอลัมน์ขวา: ชื่อสูตรอาหารและแถบ Engage สวยงาม */}
                    <div className="flex flex-col justify-between flex-1 gap-4 w-full text-center sm:text-left py-1">
                      <div>
                        <span className="text-xs font-extrabold text-[#71B254] tracking-wide uppercase">
                          สูตรอาหารแสนอร่อย
                        </span>
                        <h1 className="text-3xl md:text-4xl font-bold text-[#5A9240] leading-tight mt-1">
                          {recipe.recipeName}
                        </h1>
                      </div>

                      {/* ส่วน Engage (ถูกใจ / คอมเม้นต์ / คะแนนดาว) */}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                        <div className="flex items-center gap-2 bg-white border border-[#71B254]/30 px-3.5 py-1.5 rounded-xl">
                          <svg
                            onClick={toggleFavorite}
                            width="22"
                            height="22"
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
                          <span className="font-bold text-gray-700 text-sm">
                            {recipe.favoriteCount}
                          </span>
                        </div>

                        <div
                          onClick={() => setIsCommentOpen(!isCommentOpen)}
                          className="flex items-center gap-2 bg-white border border-[#71B254]/30 px-3.5 py-1.5 rounded-xl cursor-pointer hover:bg-[#EAF5E4]/50 transition"
                        >
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill={isCommentOpen ? "#71B254" : "none"}
                            stroke="#71B254"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                          <span className="font-bold text-[#5A9240] text-xs">
                            ความคิดเห็น
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white border border-[#71B254]/30 px-3.5 py-1.5 rounded-xl">
                          {renderStars(Math.round(recipe.rating))}
                          <span className="font-bold text-gray-800 text-sm ml-1">
                            {recipe.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {recipe.description && (
                    <div className="border-t border-[#71B254]/20 pt-4 w-full">
                      <p className="text-sm text-gray-700 leading-relaxed w-full">
                        {recipe.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 2️⃣ แถวรูปภาพและวิดีโอ (สไลด์รูปภาพสไลเดอร์) */}
              {((recipe.images && recipe.images.length > 0) ||
                (recipe.videos && recipe.videos.length > 0)) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full">
                  {/* 🖼️ ฝั่งซ้าย: สไลเดอร์รูปภาพสูตรอาหาร */}
                  {recipe.images && recipe.images.length > 0 ? (
                    <div className="flex flex-col gap-3 w-full">
                      <p className="text-xs font-bold text-[#71B254]">
                        รูปภาพสูตรอาหาร:
                      </p>
                      <ImageCarousel
                        images={recipe.images}
                        altText={recipe.recipeName}
                        themeColor="#71B254"
                      />
                    </div>
                  ) : (
                    <div className="hidden lg:block" />
                  )}

                  {/* 🎥 ฝั่งขวา: วิดีโอประกอบสูตรอาหาร */}
                  {recipe.videos && recipe.videos.length > 0 && (
                    <div className="flex flex-col gap-3 w-full">
                      <p className="text-xs font-bold text-[#71B254]">
                        วิดีโอประกอบสูตรอาหาร:
                      </p>
                      <div className="flex flex-col gap-3 w-full">
                        {recipe.videos.map((vid, idx) => (
                          <div
                            key={vid.id || idx}
                            className="w-full h-72 sm:h-80 md:h-96 rounded-2xl overflow-hidden border border-black/10 bg-black flex items-center justify-center"
                          >
                            <video
                              src={vid.videoUrl}
                              controls
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3️⃣ ส่วนผสม และวิธีทำ (กว้างเต็ม 100%) */}
              <div className="space-y-6 mt-2 flex flex-col w-full">
                {/* ส่วนผสม (กว้างเต็ม 100%) */}
                <div className="w-full p-6 rounded-2xl border border-[#71B254]/30">
                  <h3 className="text-xl font-bold text-[#5A9240] mb-4">
                    {recipe.storePosts && recipe.storePosts.length > 0
                      ? "ส่วนผสมในเซ็ทขาย"
                      : "ส่วนผสม"}
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {(() => {
                      const sp =
                        recipe.storePosts && recipe.storePosts.length > 0
                          ? recipe.storePosts[0]
                          : null;
                      if (
                        sp &&
                        sp.setIngredients &&
                        Array.isArray(sp.setIngredients) &&
                        sp.setIngredients.length > 0
                      ) {
                        return sp.setIngredients.map((ri: { name: string; quantity?: number | string; unit?: string }, idx: number) => (
                          <span
                            key={idx}
                            className="px-3.5 py-1.5 border border-[#71B254]/40 rounded-xl text-sm font-medium text-gray-800 bg-white"
                          >
                            {ri.name}
                            {ri.quantity && Number(ri.quantity) > 0
                              ? ` ${ri.quantity}${ri.unit && translateUnit(ri.unit) ? ` ${translateUnit(ri.unit)}` : ""}`
                              : ""}
                          </span>
                        ));
                      } else {
                        return recipe.recipeIngredients.map((ri) => (
                          <span
                            key={ri.id}
                            className="px-3.5 py-1.5 border border-[#71B254]/40 rounded-xl text-sm font-medium text-gray-800 bg-white"
                          >
                            {ri.ingredient.name}
                            {ri.quantity > 0
                              ? ` ${ri.quantity}${translateUnit(ri.unit) ? ` ${translateUnit(ri.unit)}` : ""}`
                              : ""}
                          </span>
                        ));
                      }
                    })()}
                  </div>
                </div>

                {/* วิธีทำ (กว้างเต็ม 100%) */}
                <div className="w-full">
                  <h3 className="text-xl font-bold text-[#5A9240] mb-4">
                    วิธีทำ
                  </h3>
                  <div className="border border-[#71B254]/30 rounded-xl p-6 bg-white w-full">
                    {recipe.instructions &&
                    recipe.instructions.trim() !== "" ? (
                      <div className="text-gray-800 text-base leading-relaxed whitespace-pre-line w-full">
                        {recipe.instructions}
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
