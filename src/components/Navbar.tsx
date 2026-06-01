"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SettingModal from "./SettingModal"; // 🌟 1. นำเข้าคอมโพเนนต์ Setting เข้ามา

// ... (ส่วนข้อมูล searchData เหมือนเดิมแปลงโค้ดต่อมาได้เลย)

export default function Navbar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingOpen, setIsSettingOpen] = useState(false); // 🌟 2. เพิ่ม State เปิด/ปิดโมดอล
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // ... (ฟังก์ชัน filteredResults และ useEffect จัดการเด้งปิดเหมือนเดิม)

  const getMenuClass = (path: string) => {
    const isActive = pathname === path || pathname?.startsWith(`${path}/`);
    return isActive
      ? "text-black border-b-[3px] border-black pb-1 cursor-pointer"
      : "text-[#A5A5A5] hover:text-gray-700 cursor-pointer transition pb-1 border-b-[3px] border-transparent";
  };

  return (
    <header className="w-[95%] max-w-[1440px] mx-auto px-4 pt-8 mb-12 flex flex-col xl:flex-row items-center xl:items-start justify-between gap-6 relative z-50">
      
      {/* 1. โลโก้ */}
      <div className="flex-shrink-0 flex items-center justify-center w-32 h-32 xl:w-40 xl:h-40">
        <img src="/photo/logo.png" alt="Kin Yark" className="w-full h-full object-contain" />
      </div>

      {/* 2. เมนูลิงก์ และ ช่องค้นหา */}
      <div className="flex-grow w-full max-w-4xl flex flex-col items-center">
        <div className="flex gap-16 mb-5 text-lg font-bold">
          <Link href="/home" className={pathname === "/" || pathname === "/home" ? "text-black border-b-[3px] border-black pb-1 cursor-pointer" : "text-[#A5A5A5] hover:text-gray-700 cursor-pointer transition pb-1 border-b-[3px] border-transparent"}>
            Home
          </Link>
          <Link href="/my-recipe" className={getMenuClass("/my-recipe")}>
            My Recipe
          </Link>
          <Link href="/favorites" className={getMenuClass("/favorites")}>
            Favorites
          </Link>
          <Link href="/posts" className={getMenuClass("/posts")}>
            Posts
          </Link>
        </div>
        
        {/* ช่องค้นหา */}
        <div className="w-full relative" ref={dropdownRef}>
          <input 
            type="text" placeholder="Search ..." value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }}
            onFocus={() => setIsDropdownOpen(true)}
            className="w-full py-4 px-8 rounded-full bg-white border border-gray-200 text-gray-700 shadow-sm focus:outline-none focus:border-[#71B254] text-lg relative z-20" 
          />
          {/* ... (ไอคอนแว่นขยายและ Dropdown เมนูค้นหาดึงของเดิมมาวางได้ครบถ้วนเลยครับ) */}
        </div>
      </div>

      {/* 3. ปุ่ม Create และ รูปโปรไฟล์ */}
      <div className="flex-shrink-0 flex items-start gap-4 pt-4">
        <Link href="/create-recipe" className="px-6 py-3 rounded-full border-2 border-[#ffffff] text-[#ffffff] font-bold bg-[#71B254] hover:bg-[#6DA84A] transition text-lg">
          + Create Recipe
        </Link>
        
        {/* 🌟 3. ผูกคำสั่ง onClick เข้าไปที่กรอบรูปโปรไฟล์เพื่อเปิด Setting */}
        <div 
          onClick={() => setIsSettingOpen(true)} 
          className="w-14 h-14 rounded-full border-[3px] border-[#3AC9B5] overflow-hidden shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all"
        >
          <img 
            src="https://images.unsplash.com/photo-1531123897727-8f129e120a4?auto=format&fit=crop&w=150&q=80" 
            alt="User Profile" className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* 🌟 4. วางตัวคอมโพเนนต์ SettingModal ต่อท้ายสุดใน Navbar */}
      <SettingModal 
        isOpen={isSettingOpen} 
        onClose={() => setIsSettingOpen(false)} 
      />

    </header>
  );
}