"use client";

import React, { useState } from "react"; // 🌟 เพิ่ม useState เข้ามาจัดการเปิด-ปิด
import Navbar from "@/components/Navbar"; 
import Link from "next/link";
import { useParams } from "next/navigation";

// =========================================
// 🍱 ข้อมูลจำลองสำหรับดูโพสต์ (Mock Data)
// =========================================
const mockRecipeData = {
  title: "Mac and Cheese Meatloaf",
  author: "Ratatouille",
  authorAvatar: "https://images.unsplash.com/photo-1531123897727-8f129e120a4?auto=format&fit=crop&w=150&q=80",
  image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80",
  rating: 3.0,
  ingredients: [
    "2 eggs", "2 tomatoes", "2 cloves garlic", "2 tbsp oil", 
    "2 tbsp milk", "1/4 cup cheese", "1/2 tsp salt", 
    "1/4 tsp black pepper", "1 tsp sugar (optional)"
  ],
  instructions: [
    "Chop tomatoes and mince garlic.",
    "Beat eggs with milk, salt, and pepper.",
    "Heat oil in a pan over medium heat.",
    "Cook garlic until fragrant.",
    "Add tomatoes and cook until soft.",
    "Pour in eggs and gently stir.",
    "Add cheese and mix until melted.",
    "Season with sugar or ketchup (optional).",
    "Cook until eggs are set.",
    "Serve warm."
  ]
};

// ข้อมูลจำลองสำหรับคอมเมนต์
const mockComments = [
  {
    id: 1,
    name: "John",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    rating: 3,
    text: "Very good idea!!",
    isReply: false,
  },
  {
    id: 2,
    name: "Alice",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    rating: 0,
    text: "Thank you.",
    isReply: true,
  },
  {
    id: 3,
    name: "Lilly",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    rating: 3,
    text: "Simple ingredients but amazing flavor, I love this recipe!",
    isReply: false,
  }
];

export default function ViewRecipePage() {
  const params = useParams();
  const recipeId = params.id;

  // 🌟 State สำหรับเปิด-ปิดคอมเมนต์ (เริ่มต้นเป็น false คือซ่อนไว้)
  const [isCommentOpen, setIsCommentOpen] = useState(false);

  // ฟังก์ชันวาดดาวสีเหลือง
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} width="16" height="16" viewBox="0 0 24 24" 
            fill={star <= rating ? "#F1C40F" : "none"} 
            stroke={star <= rating ? "#F1C40F" : "#71B254"} 
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        ))}
      </div>
    );
  };

  // ฟังก์ชันวาดดาวเปล่าสำหรับช่องพิมพ์คอมเมนต์ใหม่
  const renderEmptyStars = () => {
    return (
      <div className="flex items-center gap-1 cursor-pointer">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A5A5A5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hover:stroke-[#F1C40F] hover:fill-[#F1C40F] transition">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5EFD7] font-sans pb-20 overflow-x-hidden">
      
      <Navbar />

      <main className="w-[95%] max-w-[1000px] mx-auto px-4 mt-6">
        
        {/* =========================================
            กล่องที่ 1: รายละเอียดสูตรอาหาร (Recipe Detail)
            ========================================= */}
        <div className="bg-white border border-[#71B254] rounded-sm p-8 shadow-sm relative mb-6">
          
          {/* ปุ่ม Back ย้อนกลับ */}
          <Link href="/my-recipe" className="absolute top-6 left-6 w-8 h-8 bg-[#71B254] text-white rounded-full flex items-center justify-center hover:bg-[#5b9642] transition">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </Link>

          {/* ส่วนบน: รูปภาพ & หัวข้อ */}
          <div className="flex flex-col md:flex-row gap-10 mt-12 md:mt-4">
            
            {/* รูปภาพเมนู */}
            <div className="w-full md:w-[350px] h-[350px] flex-shrink-0">
              <img 
                src={mockRecipeData.image} 
                alt={mockRecipeData.title} 
                className="w-full h-full object-cover rounded-3xl shadow-md"
              />
            </div>

            {/* ข้อมูลด้านขวา (Title, Author, Actions) */}
            <div className="flex flex-col justify-center gap-6">
              <h1 className="text-4xl md:text-5xl font-bold text-[#71B254] leading-tight">
                {mockRecipeData.title}
              </h1>
              
              <div className="flex items-center gap-3">
                <img src={mockRecipeData.authorAvatar} alt="Author" className="w-8 h-8 rounded-full object-cover" />
                <span className="font-bold text-gray-800 text-lg">{mockRecipeData.author}</span>
              </div>

              {/* ไอคอนรีแอคชั่น (หัวใจ, คอมเมนต์, ดาว) */}
              <div className="flex items-center gap-8 mt-4">
                <div className="flex gap-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#FF0000" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:scale-110 transition">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  
                  {/* 🌟 ไอคอนข้อความ: เมื่อคลิกจะสลับค่า true/false และเปลี่ยนสี fill */}
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
                  <span className="font-bold text-gray-800 text-lg ml-2">{mockRecipeData.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 space-y-8">
            {/* ส่วนผสม */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                🥕 Ingredients
              </h3>
              <div className="flex flex-wrap gap-3">
                {mockRecipeData.ingredients.map((ing, idx) => (
                  <span key={idx} className="px-3 py-1 border border-[#71B254] rounded-md text-sm text-gray-800 bg-white shadow-sm">
                    {ing}
                  </span>
                ))}
              </div>
            </div>

            {/* วิธีทำ */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                🍲 Instructions
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

        </div>

        {/* =========================================
            🌟 กล่องที่ 2: คอมเมนต์ (Comments)
            จะเรนเดอร์แสดงผลก็ต่อเมื่อระเบิดสถานะ isCommentOpen เป็น true เท่านั้น
            ========================================= */}
        {isCommentOpen && (
          <div className="bg-white border border-[#71B254] rounded-sm p-8 md:p-10 shadow-sm animate-fade-in origin-top">
            <h2 className="text-2xl font-bold text-[#71B254] mb-8">Comment</h2>
            
            {/* ลิสต์ประวัติคอมเมนต์เดิม */}
            <div className="flex flex-col gap-6 mb-8">
              {mockComments.map((comment) => (
                <div key={comment.id} className={`flex gap-4 ${comment.isReply ? "ml-12" : ""}`}>
                  <img src={comment.avatar} alt={comment.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  <div className="flex flex-col w-full">
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-gray-900">{comment.name}</span>
                      {comment.rating > 0 && renderStars(comment.rating)}
                    </div>
                    <p className="text-gray-700 mt-1">{comment.text}</p>
                    <button className="text-gray-400 text-sm mt-2 hover:text-gray-600 transition w-fit text-left">
                      Reply
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ช่องกรอกคอมเมนต์ตอบกลับสีเขียวอ่อน พร้อมปุ่มส่งไอคอนจรวด */}
            <div className="border-t border-gray-100 pt-6 flex gap-4 items-start">
              <img 
                src="https://images.unsplash.com/photo-1531123897727-8f129e120a4?auto=format&fit=crop&w=150&q=80" 
                alt="My Profile" 
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
                    placeholder="Write a comment..." 
                    className="w-full py-3 pl-4 pr-12 rounded-md bg-[#EAF5E4] border border-[#d2e8c5] text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#71B254] shadow-inner"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71B254] hover:text-[#5b9642] transition p-1">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
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