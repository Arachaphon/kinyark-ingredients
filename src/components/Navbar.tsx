// src/components/Navbar.tsx
"use client";
import React from "react";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="w-[95%] max-w-[1440px] mx-auto px-4 pt-8 mb-12 flex flex-col xl:flex-row items-center xl:items-start justify-between gap-6">
      
      {/* 1. โลโก้ (ซ้ายสุด) */}
      <div className="flex-shrink-0 flex items-center justify-center w-32 h-32 xl:w-40 xl:h-40">
        <img src="/photo/logo.png" alt="Kin Yark Logo" className="w-full h-full object-contain" />
      </div>

      {/* 2. เมนูลิงก์ และ ช่องค้นหา (ตรงกลาง) */}
      <div className="flex-grow w-full max-w-4xl flex flex-col items-center">
        
        {/* เมนูลิงก์ (อยู่ด้านบน) */}
        <div className="flex gap-12 md:gap-16 mb-5 text-lg font-bold">
          <Link href="/" className="text-black border-b-[3px] border-black pb-1 cursor-pointer">
            Home
          </Link>
          <Link href="/my-recipe" className="text-[#A5A5A5] hover:text-gray-700 cursor-pointer transition">
            My Recipe
          </Link>
          <Link href="/favorites" className="text-[#A5A5A5] hover:text-gray-700 cursor-pointer transition">
            Favorites
          </Link>
        </div>
        
        {/* ช่องค้นหา (อยู่ด้านล่างเมนู) */}
        <div className="w-full relative">
          <input 
            type="text" 
            placeholder="Search ..." 
            className="w-full py-4 px-8 rounded-full bg-white border border-gray-100 text-gray-700 placeholder-[#A5A5A5] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#71B254] text-lg" 
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[#A5A5A5]">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </div>
        </div>

      </div>

      {/* 3. ปุ่ม Create และ รูปโปรไฟล์ (ขวาสุด) */}
      {/* ใช้ xl:pt-11 เพื่อดันลงมาให้ขนานกับช่องค้นหา (Search Bar) แบบในรูปที่ 2 */}
      <div className="flex-shrink-0 flex items-start gap-4 pt-4">
        <button className="bg-[#71B254] text-white font-bold px-6 py-3.5 rounded-full shadow-md hover:bg-[#5b9642] transition text-base md:text-lg">
          + Create Recipe
        </button>
        
        {/* รูปโปรไฟล์วงกลม มีขอบสีเขียวมินต์ */}
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border-[3px] border-[#3AC9B5] overflow-hidden shadow-sm cursor-pointer hover:opacity-80 transition">
          <img 
            src="https://images.unsplash.com/photo-1531123897727-8f129e120a4?auto=format&fit=crop&w=150&q=80" 
            alt="User Profile" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

    </header>
  );
}