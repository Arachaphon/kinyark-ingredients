/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useRouter, useParams } from "next/navigation";
import { Anuphan } from "next/font/google";

const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

const FOOD_GALLERY_POOL = [
  "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=800&q=80",
];

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

// รายการคีย์เวิร์ดเครื่องปรุง สำหรับแยกออกจากเนื้อสัตว์/ผักสด
const SEASONING_KEYWORDS = [
  "ซีอิ๊ว", "น้ำปลา", "ซอส", "น้ำมัน", "พริกไทย", "น้ำเปล่า", "น้ำซุป", "น้ำตาล",
  "เกลือ", "ผงชูรส", "รสดี", "ซอยพริก", "น้ำมะนาว", "กะทิ", "เนย"
];

export default function ViewRecipePage() {
  const router = useRouter();
  const params = useParams();

  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [recipeData, setRecipeData] = useState<{
    title: string;
    author: string;
    authorAvatar: string;
    images: string[];
    videoUrl: string;
    rating: number;
    ingredients: string[];
    instructions: string[];
  }>({
    title: "กำลังโหลดสูตรอาหาร...",
    author: "Ratatouille_Cook",
    authorAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    images: [FOOD_GALLERY_POOL[0]],
    videoUrl: "https://www.youtube.com/embed/5qap5aO4i9A",
    rating: 4.8,
    ingredients: [],
    instructions: [],
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const rawTitle = urlParams.get("title") || "สูตรอาหารแนะนำ";
    const queryTagsParam = urlParams.get("tags");
    const queryTags = queryTagsParam ? queryTagsParam.split(",").map(t => t.trim()).filter(Boolean) : [];
    const queryImage = urlParams.get("image");

    // 🧹 ตัดคำขยายออกจากชื่อเมนู เช่น "ต้มยำน้ำข้นไก่ แซ่บเวอร์" -> "ต้มยำน้ำข้นไก่"
    const cleanMenuName = rawTitle.replace(/\s*\(.*?\)\s*/g, "").replace(/(แซ่บเว่อร์|แซ่บเวอร์|ละมุนลิ้น|สูตรเด็ด|สูตรคุณแม่|อร่อย)/g, "").trim();

    // 🥩 แยกแยะส่วนผสมสด (เนื้อสัตว์/ผัก) ออกจาก เครื่องปรุงซอส
    const freshIngredients: string[] = [];
    const seasoningIngredients: string[] = [];

    queryTags.forEach((tag) => {
      const isSeasoning = SEASONING_KEYWORDS.some((kw) => tag.includes(kw));
      if (isSeasoning) {
        seasoningIngredients.push(tag);
      } else {
        freshIngredients.push(tag);
      }
    });

    // ถ้าไม่มีการส่ง Tags มา ให้ตั้งค่าเริ่มต้นไว้
    const mainFreshList = freshIngredients.length > 0 ? freshIngredients : ["ไก่", "ผักสด"];
    const mainFreshText = mainFreshList.join(", ");

    // 🖼️ รูปภาพ
    const defaultGallery = [
      queryImage || FOOD_GALLERY_POOL[0],
      FOOD_GALLERY_POOL[1],
      FOOD_GALLERY_POOL[2],
      FOOD_GALLERY_POOL[3],
    ];

    // 🎥 วิดีโอ
    let dynamicVideoUrl = "https://www.youtube.com/embed/2v-N-GZ2p9Y"; 
    if (rawTitle.includes("ต้ม") || rawTitle.includes("แกง") || rawTitle.includes("ข่า") || rawTitle.includes("ยำ")) {
      dynamicVideoUrl = "https://www.youtube.com/embed/5qap5aO4i9A"; 
    } else if (rawTitle.includes("ผัด") || rawTitle.includes("กระเพรา") || rawTitle.includes("กะเพรา")) {
      dynamicVideoUrl = "https://www.youtube.com/embed/8-W6EwE0r_k"; 
    } else if (rawTitle.includes("ทอด") || rawTitle.includes("เจียว")) {
      dynamicVideoUrl = "https://www.youtube.com/embed/9Z9kQ7DcwjU"; 
    }

    // 🥕 รายการส่วนผสมแสดงหน้าเว็บ
    const dynamicIngredients = [
      ...mainFreshList.map((item) => `${item} 200 กรัม`),
      "ข่า ตะไคร้ ใบมะกรูด หอมแดง (สำหรับเมนูต้ม)",
      "กระเทียมสับ / พริกขี้หนูสวน 2 ช้อนโต๊ะ",
      "น้ำปลา / ซอสหอยนางรม / ซีอิ๊วขาว อย่างละ 1 ช้อนโต๊ะ",
      "น้ำมะนาวสด / น้ำตาลทราย ตามชอบ",
      "ผักชี / ต้นหอม สำหรับโรยหน้า",
    ];

    // 🍲 วิธีทำแบบสมจริง (แยกของสดกับเครื่องปรุงชัดเจน)
    let dynamicInstructions: string[] = [];

    if (rawTitle.includes("ต้ม") || rawTitle.includes("ยำ") || rawTitle.includes("ข่า") || rawTitle.includes("แกง")) {
      dynamicInstructions = [
        `เตรียมวัตถุดิบสด: ล้างทำความสะอาด ${mainFreshText} แล้วหั่นชิ้นพอดีคำเตรียมไว้`,
        "ตั้งหม้อใช้ไฟปานกลาง ใส่กะทิหรือน้ำซุปต้มจนเริ่มเดือดปุดๆ",
        "ใส่ ข่า ตะไคร้ ใบมะกรูด หอมแดง และพริกขี้หนูทุบลงไป ต้มจนส่งกลิ่นหอมสมุนไพร",
        `ใส่ ${mainFreshText} ลงไปต้มในหม้อจนสุกนุ่ม (ใช้ไฟปานกลาง ไม่คนบ่อยเพื่อไม่ให้มีกลิ่นคาว)`,
        "ปรุงรสด้วยซีอิ๊วขาว ซอสหอยนางรม น้ำปลา น้ำมะนาว และพริกไทยดำ ชิมรสให้ได้ความกลมกล่อมตามชอบ",
        `ตัก ${cleanMenuName} ใส่ชาม โรยหน้าด้วยผักชี พร้อมเสิร์ฟขณะร้อนๆ`
      ];
    } else if (rawTitle.includes("ผัด") || rawTitle.includes("กระเพรา") || rawTitle.includes("กะเพรา")) {
      dynamicInstructions = [
        `เตรียมวัตถุดิบสด: ล้างทำความสะอาด ${mainFreshText} แล้วหั่นชิ้นพอดีคำ`,
        "ตั้งกระทะใส่น้ำมันพืชใช้ไฟปานกลางค่อนไปทางแรง รอจนน้ำมันเริ่มร้อน",
        "ใส่กระเทียมและพริกขี้หนูสับลงไปผัดจนส่งกลิ่นหอมฉุน",
        `ใส่ ${mainFreshText} ลงไปผัดเร่งไฟแรงให้สุกทั่วกัน`,
        "ปรุงรสด้วยซอสหอยนางรม ซีอิ๊วขาว น้ำปลา และน้ำตาลทราย ผัดคลุกเคล้าให้เข้าเนื้อ",
        `ตัก ${cleanMenuName} ราดข้าวสวยร้อนๆ พร้อมเสิร์ฟ`
      ];
    } else {
      dynamicInstructions = [
        `เตรียมวัตถุดิบสด: ล้างทำความสะอาด ${mainFreshText} แล้วหั่นชิ้นพอดีคำ`,
        "ตั้งกระทะหรือหม้อ ใส่น้ำมันพืชใช้ไฟปานกลางจนร้อนได้ที่",
        "ใส่กระเทียมสับลงไปผัดจนมีกลิ่นหอม",
        `ใส่ ${mainFreshText} ลงไปผัดและต้มจนสุกดี`,
        "ปรุงรสด้วยน้ำปลา ซอสหอยนางรม ซีอิ๊วขาว และพริกไทยดำ ชิมรสตามชอบ",
        `ตัก ${cleanMenuName} ใส่จาน พร้อมรับประทาน`
      ];
    }

    setRecipeData({
      title: rawTitle,
      author: "Ratatouille_Cook",
      authorAvatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      images: defaultGallery,
      videoUrl: dynamicVideoUrl,
      rating: 4.8,
      ingredients: dynamicIngredients,
      instructions: dynamicInstructions,
    });
  }, []);

  useEffect(() => {
    if (recipeData.images.length <= 1) return;
    const timer = setInterval(() => {
      setSelectedImageIndex((prev) => (prev + 1) % recipeData.images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [recipeData.images.length]);

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? recipeData.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) =>
      prev === recipeData.images.length - 1 ? 0 : prev + 1
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
    <div className={`min-h-screen bg-[#F5EFD7] pb-20 overflow-x-hidden ${anuphan.className}`}>
      <Navbar />

      <main className="w-[95%] max-w-[1000px] mx-auto px-4 mt-6">
        <div className="bg-white border border-[#71B254] rounded-sm p-8 shadow-sm relative mb-6">
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-6 w-8 h-8 bg-[#71B254] text-white rounded-full flex items-center justify-center hover:bg-[#5b9642] transition z-10 shadow-sm"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <div className="flex flex-col md:flex-row gap-10 mt-14 md:mt-6">
            {/* Gallery รูปภาพ 4 รูป */}
            <div className="w-full md:w-[350px] flex-shrink-0 flex flex-col gap-3">
              <div className="w-full h-[320px] relative overflow-hidden rounded-3xl group shadow-md bg-gray-100 flex items-center justify-center">
                <img
                  src={recipeData.images[selectedImageIndex] || FOOD_GALLERY_POOL[0]}
                  alt={recipeData.title}
                  className="w-full h-full object-cover transition-all duration-500 ease-in-out"
                  onError={(e) => {
                    e.currentTarget.src = FOOD_GALLERY_POOL[0];
                  }}
                />

                {recipeData.images.length > 1 && (
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm shadow-md z-10"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                )}

                {recipeData.images.length > 1 && (
                  <button
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm shadow-md z-10"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                )}

                {recipeData.images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm z-10">
                    {recipeData.images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`h-2 transition-all rounded-full ${
                          idx === selectedImageIndex ? "w-6 bg-[#71B254]" : "w-2 bg-white/70 hover:bg-white"
                        }`}
                      />
                    ))}
                  </div>
                )}

                <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm z-10">
                  {selectedImageIndex + 1} / {recipeData.images.length}
                </span>
              </div>

              {/* Thumbnails */}
              <div className="grid grid-cols-4 gap-2">
                {recipeData.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`h-16 rounded-xl overflow-hidden border-2 transition-all bg-gray-100 ${
                      selectedImageIndex === idx ? "border-[#71B254] scale-95 shadow-sm" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img || FOOD_GALLERY_POOL[0]}
                      alt={`รูปที่ ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = FOOD_GALLERY_POOL[0];
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* รายละเอียดบทความ */}
            <div className="flex flex-col justify-center gap-6">
              <h1 className="text-4xl md:text-5xl font-bold text-[#71B254] leading-tight">
                {recipeData.title}
              </h1>

              <div className="flex items-center gap-3">
                <img src={recipeData.authorAvatar} alt="ผู้เขียน" width={32} height={32} className="rounded-full object-cover" />
                <span className="font-bold text-gray-800 text-lg">{recipeData.author}</span>
              </div>

              <div className="flex items-center gap-8 mt-4">
                <div className="flex gap-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#FF0000" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:scale-110 transition">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  <svg onClick={() => setIsCommentOpen(!isCommentOpen)} width="28" height="28" viewBox="0 0 24 24" fill={isCommentOpen ? "#71B254" : "none"} stroke="#71B254" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:scale-110 transition active:scale-95">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>

                <div className="flex items-center gap-2">
                  {renderStars(recipeData.rating)}
                  <span className="font-bold text-gray-800 text-lg ml-2">{recipeData.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ส่วนผสม และ วิธีทำ */}
          <div className="mt-12 space-y-8">
            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">🥕 ส่วนผสม</h3>
              <div className="flex flex-wrap gap-3">
                {recipeData.ingredients.map((ing, idx) => (
                  <span key={idx} className="px-3 py-1.5 border border-[#71B254] rounded-md text-sm text-gray-800 bg-[#EAF5E4]/40 font-medium shadow-sm">
                    {ing}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">🍲 วิธีทำ</h3>
              <div className="border border-[#71B254] rounded-md p-6 bg-white shadow-sm">
                <ol className="list-decimal pl-5 space-y-3 text-gray-800 text-base leading-relaxed">
                  {recipeData.instructions.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* วิดีโอ */}
          {recipeData.videoUrl && (
            <div className="mt-10">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">📹 วิดีโอสอนทำอาหาร</h3>
              <div className="border border-[#71B254] rounded-md p-4 bg-white shadow-sm">
                <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black">
                  <iframe src={recipeData.videoUrl} title="Recipe Video" className="w-full h-full border-0" allowFullScreen />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ความคิดเห็น */}
        {isCommentOpen && (
          <div className="bg-white border border-[#71B254] rounded-sm p-8 md:p-10 shadow-sm animate-fade-in origin-top">
            <h2 className="text-2xl font-bold text-[#71B254] mb-8">ความคิดเห็น</h2>
            <div className="flex flex-col gap-6 mb-8">
              {mockComments.map((comment) => (
                <div key={comment.id} className={`flex gap-4 ${comment.isReply ? "ml-12" : ""}`}>
                  <img src={comment.avatar} alt={comment.name} width={40} height={40} className="rounded-full object-cover shrink-0" />
                  <div className="flex flex-col w-full">
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-gray-900">{comment.name}</span>
                      {comment.rating > 0 && renderStars(comment.rating)}
                    </div>
                    <p className="text-gray-700 mt-1">{comment.text}</p>
                    <button className="text-gray-400 text-sm mt-2 hover:text-gray-600 transition w-fit text-left">ตอบกลับ</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-6 flex gap-4 items-start">
              <img src="https://images.unsplash.com/photo-1531123897727-8f129e120a4?auto=format&fit=crop&w=150&q=80" alt="โปรไฟล์ของฉัน" width={40} height={40} className="rounded-full object-cover shrink-0 mt-1" />
              <div className="flex flex-col w-full gap-3">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-gray-900">John</span>
                  {renderEmptyStars()}
                </div>
                <div className="relative w-full">
                  <input type="text" placeholder="เขียนความคิดเห็น..." className="w-full py-3 pl-4 pr-12 rounded-md bg-[#EAF5E4] border border-[#d2e8c5] text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#71B254] shadow-inner" />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71B254] hover:text-[#5b9642] transition p-1">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
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