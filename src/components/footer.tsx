"use client";

import React from "react";
import Link from "next/link";
import { Anuphan } from "next/font/google";

const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

export default function Footer() {
  return (
    <footer
      className={`w-full bg-[#EFE9CE] border-t border-[#E2DAB3] mt-12 md:mt-20 py-8 md:py-12 text-gray-600 ${anuphan.className}`}
    >
      <div className="w-[95%] max-w-[1440px] mx-auto px-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">

        {/* ฝั่งซ้าย: โลโก้ และ รายละเอียดกลุ่ม */}
        <div className="flex flex-col gap-2 max-w-md">
          <div className="flex items-center gap-3">
            <img
              src="/photo/logo.png"
              alt="Kin Yark Logo"
              className="w-10 h-10 object-contain grayscale opacity-80"
            />
            <span className="text-xl font-black text-gray-800 tracking-wider uppercase">
              KinYark
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500 leading-relaxed">
            เปลี่ยนวัตถุดิบเหลือใช้ในตู้เย็นของคุณให้เป็นเมนูโปรดด้วยระบบอัจฉริยะ AI
            พัฒนาโดยทีม <span className="text-[#5A9240] font-bold">KINYARK</span>{" "}
            สาขาวิชาวิศวกรรมซอฟต์แวร์ มหาวิทยาลัยพะเยา
          </p>
        </div>

        {/* ฝั่งขวา: ลิงก์นำทาง และ นโยบายความเป็นส่วนตัว */}
        <div className="flex flex-wrap gap-x-12 gap-y-6 text-sm font-bold">
          <div className="flex flex-col gap-3">
            <span className="text-gray-400 text-xs uppercase tracking-wider font-extrabold">
              การนำทาง
            </span>
            <Link href="#" className="text-gray-600 hover:text-black transition">
              หน้าแรก
            </Link>
            <Link href="#" className="text-gray-600 hover:text-black transition">
              สูตรอาหารของฉัน
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-gray-400 text-xs uppercase tracking-wider font-extrabold">
              ชุมชน
            </span>
            <Link href="#" className="text-gray-600 hover:text-black transition">
              รายการโปรด
            </Link>
            <Link href="#" className="text-gray-600 hover:text-black transition">
              โพสต์ทั้งหมด
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-gray-400 text-xs uppercase tracking-wider font-extrabold">
              ข้อกำหนดทางกฎหมาย
            </span>
            <Link href="#" className="text-gray-500 hover:text-black font-medium transition">
              นโยบายความเป็นส่วนตัว
            </Link>
            <Link href="#" className="text-gray-500 hover:text-black font-medium transition">
              นโยบายคุกกี้
            </Link>
          </div>
        </div>
      </div>

      {/* แถบล่างสุด: Copyright & ปีการศึกษา */}
      <div className="w-[95%] max-w-[1440px] mx-auto px-4 border-t border-[#E2DAB3]/60 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-gray-400">
        <div>
          © {new Date().getFullYear()} <span className="text-gray-500">ทีม KINYARK</span>. สงวนลิขสิทธิ์ทั้งหมด
        </div>
        <div className="flex items-center gap-2">
          <span>ปีการศึกษา 2569</span>
          <span className="text-gray-300">|</span>
          <span>วิศวกรรมซอฟต์แวร์, มหาวิทยาลัยพะเยา (UP)</span>
        </div>
      </div>
    </footer>
  );
}