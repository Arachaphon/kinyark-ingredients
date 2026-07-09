"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Anuphan } from "next/font/google";
import SettingModal from "./SettingModal";

const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

// ข้อมูลจำลองสำหรับระบบค้นหา
const searchData = [
  "สลัดผักสวนครัว",
  "สลัดผลไม้",
  "ส้มตำไทยรสจัด",
  "สลัดไก่",
  "ต้มยำกุ้ง",
  "ผัดไทย",
];

export default function Navbar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingOpen, setIsSettingOpen] = useState(false);

  const [isSettingOpen, setIsSettingOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const filteredResults = searchData.filter((item) =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (term: string) => {
    if (!term.trim()) return;
    if (!term.trim()) return;
    router.push(`/search/results?query=${encodeURIComponent(term)}`);
    setIsDropdownOpen(false);
    setIsDropdownOpen(false);
  };

  const getMenuClass = (path: string) => {
    const isActive = pathname === path || pathname?.startsWith(`${path}/`);
    return isActive
      ? "text-black border-b-[3px] border-black pb-1 cursor-pointer"
      : "text-[#A5A5A5] hover:text-gray-700 cursor-pointer transition pb-1 border-b-[3px] border-transparent";
  };

  return (
    <header
      className={`w-[95%] max-w-[1440px] mx-auto px-4 pt-8 mb-12 flex flex-col xl:flex-row items-center xl:items-center justify-between gap-6 relative z-50 ${anuphan.className}`}
    >
      {/* 1. โลโก้ */}
      <div className="flex-shrink-0 flex items-center justify-center w-48 h-48 xl:w-64 xl:h-64 scale-110 md:scale-115 transition-all duration-300">
        <img
          src="/photo/logo.png"
          alt="Kin Yark"
          className="w-full h-full object-contain"
        />
      </div>

      {/* 2. เมนูลิงก์ และ ช่องค้นหา */}
      <div className="flex-grow w-full max-w-4xl flex flex-col items-center">
        <div className="flex gap-16 mb-5 text-lg font-bold">
          <Link href="/home" className={pathname === "/" || pathname === "/home" ? "text-black border-b-[3px] border-black pb-1 cursor-pointer" : "text-[#A5A5A5] hover:text-gray-700 cursor-pointer transition pb-1 border-b-[3px] border-transparent"}>
            หน้าหลัก
          </Link>

          <Link href="/my-recipe" className={getMenuClass("/my-recipe")}>
            สูตรอาหารของฉัน
          </Link>

          <Link href="/favorites" className={getMenuClass("/favorites")}>
            รายการโปรด
          </Link>

          <Link href="/post" className={getMenuClass("/post")}>
            โพสต์ทั้งหมด
          </Link>
        </div>


        {/* ช่องค้นหา */}
        <div className="w-full relative" ref={dropdownRef}>
          <input
            type="text"
            placeholder="ค้นหา..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearchSubmit(searchTerm);
            }}
            className="w-full py-4 px-8 rounded-full bg-white border border-gray-200 text-gray-700 shadow-sm focus:outline-none focus:border-[#71B254] text-lg relative z-20"
            className="w-full py-4 px-8 rounded-full bg-white border border-gray-200 text-gray-700 shadow-sm focus:outline-none focus:border-[#71B254] text-lg relative z-20"
          />


          {/* ไอคอนแว่นขยายฝั่งขวา */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 z-20 pointer-events-none">
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </div>

          {/* กล่องเด้งแนะแนวคำค้นหา (Dropdown Suggestions) */}
          {isDropdownOpen && searchTerm.length > 0 && (
            <div className="absolute top-[110%] left-0 w-full bg-white rounded-[24px] shadow-lg border border-gray-100 py-4 z-10 animate-fade-in overflow-hidden">
              {filteredResults.length > 0 ? (
                filteredResults.map((item, index) => (
                  <div
                  <div
                    key={index}
                    className="px-8 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-4 text-gray-700 transition"
                    onClick={() => {
                      setSearchTerm(item);
                      handleSearchSubmit(item);
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      stroke="#A5A5A5"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.3-4.3"></path>
                    </svg>
                    <span className="text-lg">{item}</span>
                  </div>
                ))
              ) : (
                <div className="px-8 py-3 text-gray-400 italic text-lg">
                  ไม่พบสูตรอาหารสำหรับ "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. ปุ่ม Create และ รูปโปรไฟล์ */}
      <div className="flex-shrink-0 flex items-center gap-4">
        <Link
          href="/create-recipe"
          className="px-6 py-3 rounded-full border-2 border-[#ffffff] text-[#ffffff] font-bold bg-[#71B254] hover:bg-[#6DA84A] transition text-lg"
        >
          + เผยแพร่สูตรอาหาร
        </Link>

        <div
          onClick={() => setIsSettingOpen(true)}

        <div
          onClick={() => setIsSettingOpen(true)}
          className="w-14 h-14 rounded-full border-[3px] border-[#3AC9B5] overflow-hidden shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all"
        >
          <img
            src="https://images.unsplash.com/photo-1531123897727-8f129e120a4?auto=format&fit=crop&w=150&q=80"
            alt="User Profile"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <SettingModal
        isOpen={isSettingOpen}
        onClose={() => setIsSettingOpen(false)}
      <SettingModal
        isOpen={isSettingOpen}
        onClose={() => setIsSettingOpen(false)}
      />
    </header>
  );
}