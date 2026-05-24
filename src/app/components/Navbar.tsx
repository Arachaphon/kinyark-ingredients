// src/components/Navbar.tsx
import React from "react";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="w-full bg-[#F5EFD7] pt-6 pb-4">
      <div className="w-[95%] max-w-[1440px] mx-auto px-4">
        
        {/* แถวบน: โลโก้, เมนู, ปุ่ม และ โปรไฟล์ */}
        <div className="flex items-center justify-between gap-4 mb-4">
          
          {/* 1. โลโก้ (ซ้ายสุด) */}
          <div className="flex-shrink-0 w-24 h-24">
            <img 
              src="/photo/logo.png" 
              alt="Kin Yark Logo" 
              className="w-full h-full object-contain" 
            />
          </div>

          {/* 2. เมนูลิงก์ (กลาง) */}
          <nav className="hidden md:flex items-center gap-12 text-xl font-bold">
            <Link href="/" className="text-black border-b-[3px] border-black pb-1">
              Home
            </Link>
            <Link href="/my-recipe" className="text-[#A5A5A5] hover:text-gray-700 transition">
              My Recipe
            </Link>
            <Link href="/favorites" className="text-[#A5A5A5] hover:text-gray-700 transition">
              Favorites
            </Link>
          </nav>

          {/* 3. ปุ่ม Create และ โปรไฟล์ (ขวาสุด) */}
          <div className="flex items-center gap-6">
            <button className="bg-[#71B254] text-white font-bold px-6 py-2.5 rounded-full shadow-sm hover:bg-[#5b9642] transition text-lg">
              + Create Recipe
            </button>
            
            {/* รูปโปรไฟล์วงกลม มีขอบสีเขียวมินต์ */}
            <div className="w-16 h-16 rounded-full border-[3px] border-[#3AC9B5] overflow-hidden shadow-sm flex-shrink-0 cursor-pointer hover:opacity-80 transition">
              <img 
                src="https://images.unsplash.com/photo-1531123897727-8f129e120a4?auto=format&fit=crop&w=150&q=80" 
                alt="User" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* แถวล่าง: ช่องค้นหา (Search Bar) */}
        <div className="w-full max-w-5xl mx-auto relative px-10">
          <input 
            type="text" 
            placeholder="Search ..." 
            className="w-full py-3 px-8 rounded-full bg-white border border-gray-100 text-gray-700 placeholder-[#A5A5A5] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#71B254] text-lg"
          />
          <div className="absolute right-16 top-1/2 -translate-y-1/2 text-[#A5A5A5]">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </div>
        </div>

      </div>
    </header>
  );
}