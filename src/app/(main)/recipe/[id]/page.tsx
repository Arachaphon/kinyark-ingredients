"use client";

import Image from "next/image";
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { Anuphan } from "next/font/google";

const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

// =========================================
// 🍱 ข้อมูลจำลองสำหรับดูโพสต์ (Mock Data)
// =========================================
const mockRecipeData = {
  title: "มีตโลฟแมคแอนด์ชีส",
  author: "Ratatouille",
  authorAvatar:
    "https://images.unsplash.com/photo-1531123897727-8f129e120a4?auto=format&fit=crop&w=150&q=80",
  images: [
    "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=600&q=80",
  ],
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // URL ตัวอย่างวิดีโอ
  rating: 3.0,
  ingredients: [
    "ไข่ 2 ฟอง",
    "มะเขือเทศ 2 ลูก",
    "กระเทียม 2 กลีบ",
    "น้ำมัน 2 ช้อนโต๊ะ",
    "นม 2 ช้อนโต๊ะ",
    "ชีส 1/4 ถ้วย",
    "เกลือ 1/2 ช้อนชา",
    "พริกไทยดำ 1/4 ช้อนชา",
    "น้ำตาล 1 ช้อนชา (ไม่ใส่ก็ได้)",
  ],
  instructions: [
    "หั่นมะเขือเทศและสับกระเทียมให้ละเอียด",
    "ตีไข่กับนม เกลือ และพริกไทยเข้าด้วยกัน",
    "ตั้งกระทะใส่น้ำมัน ใช้ไฟกลาง",
    "ผัดกระเทียมจนหอม",
    "ใส่มะเขือเทศลงไปผัดจนเริ่มนิ่ม",
    "เทไข่ลงไปแล้วคนเบา ๆ",
    "ใส่ชีสและคนจนละลาย",
    "ปรุงรสเพิ่มด้วยน้ำตาลหรือซอสมะเขือเทศ (ไม่ใส่ก็ได้)",
    "ปรุงจนไข่สุก",
    "เสิร์ฟขณะอุ่น",
  ],
};

const mockComments = [
  {
    id: 1,
    name: "John",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    rating: 3,
    text: "ไอเดียดีมากเลย!!",
    isReply: false,
  },
  {
    id: 2,
    name: "Alice",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    rating: 0,
    text: "ขอบคุณนะ",
    isReply: true,
  },
  {
    id: 3,
    name: "Lilly",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    rating: 3,
    text: "วัตถุดิบเรียบง่าย แต่รสชาติยอดเยี่ยมมาก ฉันชอบสูตรนี้!",
    isReply: false,
  },
];

export default function ViewRecipePage() {
  const router = useRouter();
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? mockRecipeData.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) =>
      prev === mockRecipeData.images.length - 1 ? 0 : prev + 1
    );
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

  return (
    <div
      className={`min-h-screen bg-[#F5EFD7] pb-20 overflow-x-hidden ${anuphan.className}`}
    >
      <Navbar />

      <main className="w-[95%] max-w-[1000px] mx-auto px-4 mt-6">
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
            {/* 🖼️ ส่วนแสดงผล Gallery รูปภาพ + จุดไข่ปลา + ปุ่มเลื่อนรูป */}
            <div className="w-full md:w-[350px] flex-shrink-0 flex flex-col gap-3">
              {/* รูปภาพหลัก */}
              <div className="w-full h-[320px] relative overflow-hidden rounded-3xl group shadow-md">
                <img
                  src={mockRecipeData.images[selectedImageIndex]}
                  alt={mockRecipeData.title}
                  className="w-full h-full object-cover transition-all duration-300"
                />

                {/* ปุ่มลูกศรซ้าย */}
                {mockRecipeData.images.length > 1 && (
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm shadow-md z-10"
                    aria-label="Previous Image"
                  >
                    <svg
                      width="18"
                      height="18"
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
                )}

                {/* ปุ่มลูกศรขวา */}
                {mockRecipeData.images.length > 1 && (
                  <button
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm shadow-md z-10"
                    aria-label="Next Image"
                  >
                    <svg
                      width="18"
                      height="18"
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
                )}

                {/* จุดไข่ปลา (Pagination Dots) */}
                {mockRecipeData.images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm z-10">
                    {mockRecipeData.images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`h-2 transition-all rounded-full ${
                          idx === selectedImageIndex
                            ? "w-6 bg-[#71B254]"
                            : "w-2 bg-white/70 hover:bg-white"
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Badge แสดงจำนวนรูป เช่น 1 / 4 */}
                <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm z-10">
                  {selectedImageIndex + 1} / {mockRecipeData.images.length}
                </span>
              </div>

              {/* Thumbnails ตัวเลือกดูรูปทั้ง 4 รูป */}
              <div className="grid grid-cols-4 gap-2">
                {mockRecipeData.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImageIndex === idx
                        ? "border-[#71B254] scale-95 shadow-sm"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`รูปที่ ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* รายละเอียดบทความ */}
            <div className="flex flex-col justify-center gap-6">
              <h1 className="text-4xl md:text-5xl font-bold text-[#71B254] leading-tight">
                {mockRecipeData.title}
              </h1>

              <div className="flex items-center gap-3">
                <img
                  src={mockRecipeData.authorAvatar}
                  alt="ผู้เขียน"
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
                <span className="font-bold text-gray-800 text-lg">
                  {mockRecipeData.author}
                </span>
              </div>

              <div className="flex items-center gap-8 mt-4">
                <div className="flex gap-4">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="#FF0000"
                    stroke="#FF0000"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="cursor-pointer hover:scale-110 transition"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>

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
                  {renderStars(mockRecipeData.rating)}
                  <span className="font-bold text-gray-800 text-lg ml-2">
                    {mockRecipeData.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ส่วนผสม และ วิธีทำ */}
          <div className="mt-12 space-y-8">
            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                🥕 ส่วนผสม
              </h3>
              <div className="flex flex-wrap gap-3">
                {mockRecipeData.ingredients.map((ing, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 border border-[#71B254] rounded-md text-sm text-gray-800 bg-white shadow-sm"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                🍲 วิธีทำ
              </h3>
              <div className="border border-[#71B254] rounded-md p-6 bg-white">
                <ol className="list-decimal pl-5 space-y-2 text-gray-800 text-base leading-relaxed">
                  {mockRecipeData.instructions.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* 🎬 ส่วนแสดงผล Video Player (ย้ายมาไว้ข้างล่างสุด) */}
          {mockRecipeData.videoUrl && (
            <div className="mt-10">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                📹 วิดีโอสอนทำอาหาร
              </h3>
              <div className="border border-[#71B254] rounded-md p-4 bg-white">
                <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black">
                  <iframe
                    src={mockRecipeData.videoUrl}
                    title="Recipe Video"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ส่วนความคิดเห็น */}
        {isCommentOpen && (
          <div className="bg-white border border-[#71B254] rounded-sm p-8 md:p-10 shadow-sm animate-fade-in origin-top">
            <h2 className="text-2xl font-bold text-[#71B254] mb-8">
              ความคิดเห็น
            </h2>

            <div className="flex flex-col gap-6 mb-8">
              {mockComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`flex gap-4 ${comment.isReply ? "ml-12" : ""}`}
                >
                  <img
                    src={comment.avatar}
                    alt={comment.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover shrink-0"
                  />
                  <div className="flex flex-col w-full">
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-gray-900">
                        {comment.name}
                      </span>
                      {comment.rating > 0 && renderStars(comment.rating)}
                    </div>
                    <p className="text-gray-700 mt-1">{comment.text}</p>
                    <button className="text-gray-400 text-sm mt-2 hover:text-gray-600 transition w-fit text-left">
                      ตอบกลับ
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-6 flex gap-4 items-start">
              <img
                src="https://images.unsplash.com/photo-1531123897727-8f129e120a4?auto=format&fit=crop&w=150&q=80"
                alt="โปรไฟล์ของฉัน"
                width={40}
                height={40}
                className="rounded-full object-cover shrink-0 mt-1"
              />

              <div className="flex flex-col w-full gap-3">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-gray-900">John</span>
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
      </main>
    </div>
  );
}