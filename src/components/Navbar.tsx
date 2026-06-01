"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // 🌟 เพิ่ม usePathname เข้ามา

// 🍱 ข้อมูลจำลองสำหรับระบบค้นหา (Mock Data)
const searchData = [
  "Garden Salad",
  "Fruit Salad",
  "Spicy Thai Salad",
  "Chicken Salad",
  "Tom Yum Goong",
  "Pad Thai",
];

export default function Navbar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // 🌟 เรียกใช้ usePathname เพื่อเช็ค URL ปัจจุบัน
  const pathname = usePathname();

  // กรองผลลัพธ์การค้นหาจากคำที่พิมพ์
  const filteredResults = searchData.filter((item) =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ปิดกล่องค้นหาเมื่อคลิกพื้นที่อื่นบนหน้าเว็บ
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ฟังก์ชันเช็คว่าหน้าไหนกำลัง Active อยู่
  const getMenuClass = (path: string) => {
    // ถ้าหน้าปัจจุบันตรงกับ path หรือกำลังอยู่ในหน้าย่อยของ path นั้น (เช่น /my-recipe/edit/1)
    const isActive = pathname === path || pathname?.startsWith(`${path}/`);
    
    return isActive
      ? "text-black border-b-[3px] border-black pb-1 cursor-pointer" // 👈 สีดำ + ขีดเส้นใต้
      : "text-[#A5A5A5] hover:text-gray-700 cursor-pointer transition pb-1 border-b-[3px] border-transparent"; // 👈 สีเทา
  };

  return (
    <header className="w-[95%] max-w-[1440px] mx-auto px-4 pt-8 mb-12 flex flex-col xl:flex-row items-center xl:items-start justify-between gap-6 relative z-50">
      
      {/* 1. โลโก้ (ซ้ายสุด) */}
      <div className="flex-shrink-0 flex items-center justify-center w-32 h-32 xl:w-40 xl:h-40">
        <img src="/photo/logo.png" alt="Kin Yark" className="w-full h-full object-contain" />
      </div>

      {/* 2. เมนูลิงก์ และ ช่องค้นหา (ตรงกลาง) */}
      <div className="flex-grow w-full max-w-4xl flex flex-col items-center">
        
        {/* เมนูลิงก์ 🌟 เปลี่ยนมาใช้ฟังก์ชัน getMenuClass */}
        <div className="flex gap-16 mb-5 text-lg font-bold">
          {/* รองรับทั้ง / และ /home */}
          <Link href="/home" className={pathname === "/" || pathname === "/home" ? "text-black border-b-[3px] border-black pb-1 cursor-pointer" : "text-[#A5A5A5] hover:text-gray-700 cursor-pointer transition pb-1 border-b-[3px] border-transparent"}>
            Home
          </Link>
          <Link href="/my-recipe" className={getMenuClass("/my-recipe")}>
            My Recipe
          </Link>
          <Link href="/favorites" className={getMenuClass("/favorites")}>
            Favorites
          </Link>
          <Link href="/post" className={getMenuClass("/post")}>
            Posts
          </Link>
        </div>
        
        {/* ช่องค้นหา (Search Bar) + กล่อง Dropdown */}
        <div className="w-full relative" ref={dropdownRef}>
          {/* กล่อง Input ค้นหา */}
          <input 
            type="text" 
            placeholder="Search ..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            className="w-full py-4 px-8 rounded-full bg-white border border-gray-200 text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:border-[#71B254] text-lg relative z-20" 
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 z-20 pointer-events-none">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </div>

          {/* กล่องเด้งแสดงผลลัพธ์ (Dropdown Suggestions) */}
          {isDropdownOpen && searchTerm.length > 0 && (
            <div className="absolute top-[110%] left-0 w-full bg-white rounded-[24px] shadow-lg border border-gray-100 py-4 z-10 animate-fade-in overflow-hidden">
              {filteredResults.length > 0 ? (
                filteredResults.map((item, index) => (
                  <div 
                    key={index}
                    className="px-8 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-4 text-gray-700 transition"
                    onClick={() => {
                      setSearchTerm(item);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <svg width="18" height="18" fill="none" stroke="#A5A5A5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.3-4.3"></path>
                    </svg>
                    <span className="text-lg">{item}</span>
                  </div>
                ))
              ) : (
                <div className="px-8 py-3 text-gray-400 italic text-lg">
                  No recipes found for "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. ปุ่ม Create และ รูปโปรไฟล์ (ขวาสุด) */}
      <div className="flex-shrink-0 flex items-start gap-4 pt-4">
        <Link href="/create-recipe" className="px-6 py-3 rounded-full border-2 border-[#ffffff] text-[#ffffff] font-bold bg-[#71B254] hover:bg-[#6DA84A] transition text-lg">
          + Create Recipe
        </Link>
        
        {/* รูปโปรไฟล์ตั้งค่าเป็น w-14 h-14 (56px) ซึ่งจะพอดีกับปุ่ม Create เดิมของคุณพอดี */}
        <div className="w-14 h-14 rounded-full border-[3px] border-[#3AC9B5] overflow-hidden shadow-sm cursor-pointer hover:opacity-80 transition">
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