"use client";

import Image from "next/image";
import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Anuphan } from "next/font/google";
import SettingModal from "./SettingModal";

const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

export interface UserProfile {
  id?: string;
  username?: string | null;
  email?: string;
  avatarUrl?: string | null;
}

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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const filteredResults = searchData.filter((item) =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.user);
      }
    } catch (error) {
      console.error("Failed to fetch user", error);
    }
  }, []);

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

  useEffect(() => {
    fetchUser();
  }, [isSettingOpen, fetchUser]);

  const handleSearchSubmit = (term: string) => {
    if (!term.trim()) return;
    router.push(`/search/results?query=${encodeURIComponent(term)}`);
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
      className={`w-[95%] max-w-[1440px] mx-auto px-4 pt-4 sm:pt-6 md:pt-8 mb-6 md:mb-12 flex flex-col xl:flex-row items-center xl:items-center justify-between gap-4 sm:gap-6 relative z-50 ${anuphan.className}`}
    >
      {/* 1. โลโก้ */}
      <div className="flex-shrink-0 flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-48 lg:h-48 xl:w-64 xl:h-64 scale-110 md:scale-115 transition-all duration-300 relative">
        <Image
          src="/photo/logo.png"
          alt="Kin Yark"
          fill
          className="object-contain"
        />
      </div>

      {/* 2. เมนูลิงก์ และ ช่องค้นหา */}
      <div className="flex-grow w-full max-w-4xl flex flex-col items-center">
        <div className="flex gap-4 sm:gap-6 md:gap-10 lg:gap-16 mb-5 text-sm sm:text-base md:text-lg font-bold flex-wrap justify-center">
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
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearchSubmit(searchTerm);
            }}
            className="w-full py-3 px-5 sm:py-4 sm:px-8 rounded-full bg-white border border-gray-200 text-gray-700 shadow-sm focus:outline-none focus:border-[#71B254] text-base sm:text-lg relative z-20"
          />


          {/* ไอคอนแว่นขยายฝั่งขวา */}
          <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-gray-400 z-20 pointer-events-none">
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
                  ไม่พบสูตรอาหารสำหรับ &quot;{searchTerm}&quot;
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
          className="px-4 py-2 sm:px-6 sm:py-3 rounded-full border-2 border-[#ffffff] text-[#ffffff] font-bold bg-[#71B254] hover:bg-[#6DA84A] transition text-sm sm:text-base md:text-lg"
        >
          + เผยแพร่สูตรอาหาร
        </Link>

        <div
          onClick={() => setIsSettingOpen(true)}
          className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full border-[3px] border-[#3AC9B5] overflow-hidden shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all bg-gray-100 flex items-center justify-center"
        >
          {userProfile?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- TODO: user-controlled arbitrary domain, no validation yet
            <img
              src={userProfile.avatarUrl}
              alt="User Profile"
              className="w-full h-full object-cover"
            />
          ) : (
             <span className="text-xl font-bold text-gray-500">{userProfile?.username?.charAt(0).toUpperCase() || userProfile?.email?.charAt(0).toUpperCase() || "U"}</span>
          )}
        </div>
      </div>

      <SettingModal
        isOpen={isSettingOpen}
        onClose={() => setIsSettingOpen(false)}
        userProfile={userProfile}
      />
    </header>
  );
}