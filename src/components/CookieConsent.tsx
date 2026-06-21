"use client";

import { useState } from "react";
export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return !localStorage.getItem(
      "kinyark_cookie_consent"
    );
  });

  const handleAcceptAll = () => {
    localStorage.setItem(
      "kinyark_cookie_consent",
      "accepted"
    );

    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(
      "kinyark_cookie_consent",
      "declined"
    );

    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[750px] bg-white border border-[#71B254]/30 rounded-[24px] p-6 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.08)] z-[200] animate-fade-in flex flex-col md:flex-row items-center justify-between gap-6">
      
      {/* ฝั่งซ้าย: ข้อความรายละเอียดข้อตกลง */}
      <div className="flex gap-4 items-start w-full md:max-w-[70%]">
        <div className="text-4xl select-none pt-1">🍪</div>
        <div>
          <h4 className="font-extrabold text-gray-900 text-lg mb-1">
            เราใช้คุกกี้เพื่อประสบการณ์ที่ดีขึ้น!
          </h4>
          <p className="text-gray-500 text-sm leading-relaxed font-medium">
            เว็บไซต์ <span className="text-[#71B254] font-bold">KinYark</span> มีการใช้งานคุกกี้ (Cookies) เพื่อช่วยเพิ่มประสิทธิภาพในการบันทึกวัตถุดิบตู้เย็น และคัดสรรแนะนำสูตรอาหารจาก AI ให้ตอบโจทย์ลิ้นของคุณมากที่สุด คุณสามารถเลือกยอมรับหรือปฏิเสธได้ทุกเมื่อ
          </p>
        </div>
      </div>

      {/* ฝั่งขวา: ปุ่ม Action นุ่มๆ สไตล์ Tailwind v4 */}
      <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
        {/* ปุ่มปฏิเสธ */}
        <button 
          onClick={handleDecline}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200"
        >
          ปฏิเสธ
        </button>

        {/* ปุ่มยอมรับทั้งหมด */}
        <button 
          onClick={handleAcceptAll}
          className="w-full sm:w-auto px-6 py-2.5 bg-[#71B254] text-white text-sm font-extrabold rounded-xl hover:bg-[#5b9642] active:scale-95 transition-all duration-200 shadow-sm"
        >
          ยอมรับทั้งหมด
        </button>
      </div>

    </div>
  );
}