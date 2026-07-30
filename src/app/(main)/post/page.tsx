/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { Anuphan } from "next/font/google";

const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

// =========================================
// 🍱 ข้อมูลจำลองสำหรับหน้า Feed รวมโพสต์ (Mock Data)
// =========================================
const mockFeedPosts = [
  {
    id: 1,
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
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    rating: 3.0,
    likes: 124,
    commentsCount: 3,
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
    comments: [
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
        text: "วัตถุดิบง่าย ๆ แต่รสชาติยอดเยี่ยมมาก ฉันชอบสูตรนี้มาก!",
        isReply: false,
      },
    ],
  },
  {
    id: 2,
    title: "อะโวคาโดโทสต์เพื่อสุขภาพ",
    author: "Chef Green",
    authorAvatar:
      "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
    images: [
      "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1484723091499-0382a2088f12?auto=format&fit=crop&w=600&q=80",
    ],
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    rating: 4.8,
    likes: 89,
    commentsCount: 1,
    ingredients: [
      "ขนมปังโฮลวีต 2 แผ่น",
      "อะโวคาโดสุก 1 ลูก",
      "มะเขือเทศเชอร์รี",
      "เกลือและพริกไทย",
      "พริกป่น",
      "น้ำมะนาว",
    ],
    instructions: [
      "ปิ้งขนมปังจนเป็นสีเหลืองทอง",
      "บดอะโวคาโดด้วยส้อม แล้วผสมน้ำมะนาวเล็กน้อย",
      "ทาอะโวคาโดบดลงบนขนมปังให้ทั่ว",
      "วางมะเขือเทศเชอร์รีที่ผ่าครึ่งไว้ด้านบน",
      "โรยเกลือ พริกไทย และพริกป่นตามชอบ",
      "เพลิดเพลินกับอาหารเช้าเพื่อสุขภาพของคุณ!",
    ],
    comments: [
      {
        id: 4,
        name: "Sarah",
        avatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
        rating: 5,
        text: "ทำเร็วมากและอร่อยสุด ๆ! ทำเมนูนี้ทุกเช้าเลย",
        isReply: false,
      },
    ],
  },
];

export default function PostsFeedPage() {
  const [openComments, setOpenComments] = useState<Record<number, boolean>>({});
  const [activeImageIndex, setActiveImageIndex] = useState<Record<number, number>>({});

  const toggleComments = (postId: number) => {
    setOpenComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleSelectImage = (postId: number, index: number) => {
    setActiveImageIndex((prev) => ({
      ...prev,
      [postId]: index,
    }));
  };

  // เลื่อนรูปถอยหลังของโพสต์นั้นๆ
  const handlePrevImage = (postId: number, totalImages: number) => {
    setActiveImageIndex((prev) => {
      const currentIdx = prev[postId] || 0;
      return {
        ...prev,
        [postId]: currentIdx === 0 ? totalImages - 1 : currentIdx - 1,
      };
    });
  };

  // เลื่อนรูปไปข้างหน้าของโพสต์นั้นๆ
  const handleNextImage = (postId: number, totalImages: number) => {
    setActiveImageIndex((prev) => {
      const currentIdx = prev[postId] || 0;
      return {
        ...prev,
        [postId]: currentIdx === totalImages - 1 ? 0 : currentIdx + 1,
      };
    });
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

      <main className="w-[95%] max-w-[1000px] mx-auto px-4 mt-8">
        {mockFeedPosts.map((post) => {
          const currentImgIdx = activeImageIndex[post.id] || 0;

          return (
            <div key={post.id} className="mb-12 animate-fade-in">
              <div className="bg-white border border-[#71B254] rounded-sm p-8 shadow-sm mb-4">
                <div className="flex flex-col md:flex-row gap-10">
                  
                  {/* 🖼️ ส่วนแสดงผล Gallery รูปภาพ + ปุ่มเลื่อน + จุดไข่ปลา */}
                  <div className="w-full md:w-[350px] flex-shrink-0 flex flex-col gap-3">
                    {/* รูปภาพหลัก */}
                    <div className="w-full h-[320px] relative overflow-hidden rounded-3xl group shadow-md">
                      <img
                        src={post.images[currentImgIdx]}
                        alt={post.title}
                        className="w-full h-full object-cover transition-all duration-300"
                      />

                      {/* ปุ่มลูกศรซ้าย */}
                      {post.images.length > 1 && (
                        <button
                          onClick={() => handlePrevImage(post.id, post.images.length)}
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
                      {post.images.length > 1 && (
                        <button
                          onClick={() => handleNextImage(post.id, post.images.length)}
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

                      {/* 🔴 จุดไข่ปลา (Pagination Dots) ด้านล่างตรงกลางรูปภาพ */}
                      {post.images.length > 1 && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm z-10">
                          {post.images.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelectImage(post.id, idx)}
                              className={`h-2 transition-all rounded-full ${
                                idx === currentImgIdx
                                  ? "w-6 bg-[#71B254]"
                                  : "w-2 bg-white/70 hover:bg-white"
                              }`}
                              aria-label={`Go to slide ${idx + 1}`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Badge แสดงจำนวนรูป */}
                      <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm z-10">
                        {currentImgIdx + 1} / {post.images.length}
                      </span>
                    </div>

                    {/* Thumbnail เลือกดูรูปภาพทั้งหมด 4 รูป */}
                    <div className="grid grid-cols-4 gap-2">
                      {post.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectImage(post.id, idx)}
                          className={`h-16 rounded-xl overflow-hidden border-2 transition-all ${
                            currentImgIdx === idx
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

                  {/* รายละเอียดโพสต์ */}
                  <div className="flex flex-col justify-center gap-6">
                    <h1 className="text-4xl md:text-5xl font-bold text-[#71B254] leading-tight">
                      {post.title}
                    </h1>

                    <div className="flex items-center gap-3">
                      <img
                        src={post.authorAvatar}
                        alt="ผู้เขียน"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="font-bold text-gray-800 text-lg">
                        {post.author}
                      </span>
                    </div>

                    <div className="flex items-center gap-8 mt-4">
                      <div className="flex items-center gap-4">
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
                          onClick={() => toggleComments(post.id)}
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill={openComments[post.id] ? "#71B254" : "none"}
                          stroke="#71B254"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="cursor-pointer hover:scale-110 transition-all active:scale-95"
                        >
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </div>

                      <div className="flex items-center gap-2">
                        {renderStars(post.rating)}
                        <span className="font-bold text-gray-800 text-lg ml-2">
                          {post.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 space-y-8">
                  {/* 🥕 ส่วนผสม */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                      <span className="text-[#F39C12]">🥕</span> ส่วนผสม
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {post.ingredients.map((ing, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 border border-[#71B254] rounded-md text-sm text-gray-800 bg-white shadow-sm"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 🍲 วิธีทำ */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                      <span className="text-[#E67E22]">🍲</span> วิธีทำ
                    </h3>
                    <div className="border border-[#71B254] rounded-md p-6 bg-white">
                      <ol className="list-decimal pl-5 space-y-2 text-gray-800 text-base leading-relaxed">
                        {post.instructions.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  {/* 🎥 วิดีโอสอนทำอาหาร (ตำแหน่งด้านล่างสุด) */}
                  {post.videoUrl && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                        <span className="text-[#E74C3C]">🎥</span> วิดีโอสอนทำอาหาร 
                      </h3>
                      <div className="border border-[#71B254] rounded-md p-4 bg-white shadow-sm overflow-hidden">
                        <video
                          src={post.videoUrl}
                          controls
                          preload="metadata"
                          className="w-full max-h-[480px] rounded-md bg-black object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              {openComments[post.id] && (
                <div className="bg-white border border-[#71B254] rounded-sm p-8 shadow-sm transition-all duration-300 transform origin-top animate-fade-in">
                  <h2 className="text-2xl font-bold text-[#71B254] mb-8">
                    ความคิดเห็น
                  </h2>

                  <div className="flex flex-col gap-6 mb-8">
                    {post.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`flex gap-4 ${comment.isReply ? "ml-12" : ""}`}
                      >
                        <img
                          src={comment.avatar}
                          alt={comment.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
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
                      className="w-10 h-10 rounded-full object-cover shrink-0 mt-1"
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
            </div>
          );
        })}
      </main>
    </div>
  );
}