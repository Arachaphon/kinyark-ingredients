"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";

// =========================================
// 🍱 ข้อมูลจำลองสำหรับหน้า Feed รวมโพสต์ (Mock Data)
// =========================================
const mockFeedPosts = [
  {
    id: 1,
    title: "Mac and Cheese Meatloaf",
    author: "Ratatouille",
    authorAvatar: "https://images.unsplash.com/photo-1531123897727-8f129e120a4?auto=format&fit=crop&w=150&q=80",
    image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80",
    rating: 3.0,
    likes: 124,
    commentsCount: 3,
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
    ],
    comments: [
      { id: 1, name: "John", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", rating: 3, text: "Very good idea!!", isReply: false },
      { id: 2, name: "Alice", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", rating: 0, text: "Thank you.", isReply: true },
      { id: 3, name: "Lilly", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80", rating: 3, text: "Simple ingredients but amazing flavor, I love this recipe!", isReply: false }
    ]
  },
  {
    id: 2,
    title: "Healthy Avocado Toast",
    author: "Chef Green",
    authorAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
    image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    likes: 89,
    commentsCount: 1,
    ingredients: [
      "2 slices whole wheat bread", "1 ripe avocado", "Cherry tomatoes", 
      "Salt & Pepper", "Chili flakes", "Lemon juice"
    ],
    instructions: [
      "Toast the bread until golden brown.",
      "Mash the avocado with a fork and mix in a splash of lemon juice.",
      "Spread the mashed avocado evenly on the toast.",
      "Top with halved cherry tomatoes.",
      "Sprinkle salt, pepper, and chili flakes to taste.",
      "Enjoy your healthy breakfast!"
    ],
    comments: [
      { id: 4, name: "Sarah", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80", rating: 5, text: "So quick and delicious! Make this every morning.", isReply: false }
    ]
  }
];

export default function PostsFeedPage() {
  // 🌟 State สำหรับเก็บว่าโพสต์ไหนกำลังเปิดคอมเมนต์อยู่ (เช่น {1: true, 2: false})
  const [openComments, setOpenComments] = useState<Record<number, boolean>>({});

  // ฟังก์ชันสลับสถานะเปิด-ปิดคอมเมนต์แยกตามไอดีโพสต์
  const toggleComments = (postId: number) => {
    setOpenComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };
  
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

      <main className="w-[95%] max-w-[1000px] mx-auto px-4 mt-8">
        
        {mockFeedPosts.map((post) => (
          <div key={post.id} className="mb-12 animate-fade-in">
            
            {/* =========================================
                ส่วนที่ 1: รายละเอียดสูตรอาหาร
                ========================================= */}
            <div className="bg-white border border-[#71B254] rounded-sm p-8 shadow-sm mb-4">
              
              <div className="flex flex-col md:flex-row gap-10">
                <div className="w-full md:w-[350px] h-[350px] flex-shrink-0">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover rounded-3xl shadow-md" />
                </div>

                <div className="flex flex-col justify-center gap-6">
                  <h1 className="text-4xl md:text-5xl font-bold text-[#71B254] leading-tight">
                    {post.title}
                  </h1>
                  
                  <div className="flex items-center gap-3">
                    <img src={post.authorAvatar} alt="Author" className="w-8 h-8 rounded-full object-cover" />
                    <span className="font-bold text-gray-800 text-lg">{post.author}</span>
                  </div>

                  {/* ไอคอนรีแอคชั่น */}
                  <div className="flex items-center gap-8 mt-4">
                    <div className="flex items-center gap-4">
                      {/* หัวใจ */}
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="#FF0000" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:scale-110 transition">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      
                      {/* 🌟 ไอคอนข้อความ (เพิ่ม onClick สลับเปิด/ปิดคอมเมนต์ และเอฟเฟกต์สีเมื่อ Active) */}
                      <svg 
                        onClick={() => toggleComments(post.id)}
                        width="28" 
                        height="28" 
                        viewBox="0 0 24 24" 
                        fill={openComments[post.id] ? "#71B254" : "none"} // ถ้าเปิดอยู่ให้ระบายสีเขียวทึบ
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
                      <span className="font-bold text-gray-800 text-lg ml-2">{post.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 space-y-8">
                {/* ส่วนผสม */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <span className="text-[#F39C12]">🥕</span> Ingredients
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {post.ingredients.map((ing, idx) => (
                      <span key={idx} className="px-3 py-1 border border-[#71B254] rounded-md text-sm text-gray-800 bg-white shadow-sm">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>

                {/* วิธีทำ */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <span className="text-[#E67E22]">🍲</span> Instructions
                  </h3>
                  <div className="border border-[#71B254] rounded-md p-6 bg-white">
                    <ol className="list-decimal pl-5 space-y-2 text-gray-800 text-base leading-relaxed">
                      {post.instructions.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>

            </div>

            {/* =========================================
                🌟 ส่วนที่ 2: คอมเมนต์ (Comments Section)
                จะถูกเรนเดอร์ก็ต่อเมื่อกดไอคอนข้อความของโพสต์นั้นๆ เท่านั้น
                ========================================= */}
            {openComments[post.id] && (
              <div className="bg-white border border-[#71B254] rounded-sm p-8 shadow-sm transition-all duration-300 transform origin-top animate-fade-in">
                <h2 className="text-2xl font-bold text-[#71B254] mb-8">Comment</h2>
                
                {/* รายการคอมเมนต์ที่มีอยู่ */}
                <div className="flex flex-col gap-6 mb-8">
                  {post.comments.map((comment) => (
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

                {/* กล่องพิมพ์คอมเมนต์ */}
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

          </div>
        ))}

      </main>
    </div>
  );
}