"use client";

// 🛠️ แก้ไขจุดพังดั้งเดิม: อิมพอร์ต React เข้ามาให้เต็มระบบเพื่อเคลียร์บั๊ก Cannot find name 'React'
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const router = useRouter(); // 🌟 รูเตอร์สำหรับปุ่ม Back to Login

  // 🛠️ ปิดบั๊กวิกฤต (image_9b3d3a.jpg): เปลี่ยนจาก React.FormEvent (Deprecated)
  // 🌟 ไปใช้ React.SyntheticEvent ครอบจักรวาลตามที่ระบบแนะนำ เพื่อป้องกันหน้าจอเบี้ยวและคอมไพล์ไม่ผ่าน
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault(); // คำสั่งป้องกันหน้าเว็บรีเฟรช ยังทำงานได้สมบูรณ์แบบเหมือนเดิม

    console.log({
      email,
    });

    
  };

  return (
    // โครงสร้างหลัก: เคลื่อนตัวตามจอ flex-col (มือถือ) -> lg:flex-row (จอเดสก์ท็อป)
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F7F7F7] overflow-x-hidden">
      
      {/* ================= LEFT / TOP SIDE (Logo & Intro) ================= */}
      <div
        className="
          w-full lg:w-[45%]
          min-h-[40vh] lg:min-h-screen
          bg-[#F5EFD7]
          flex
          flex-col
          items-center
          justify-center
          px-6 sm:px-8
          py-12 lg:py-0
          shrink-0
          transition-all duration-300
          
          /* 🛠️ แก้ไขจุด hydration mismatch: ใช้คลาสสิก Tailwind คุมความโค้งแทน inline style */
          rounded-br-[50%/30px] lg:rounded-br-[35%/100%]
          rounded-bl-[50%/30px] lg:rounded-bl-0
          rounded-tr-0 lg:rounded-tr-[35%/100%]
        "
      >
        {/* Logo */}
        <div className="w-44 h-44 sm:w-52 sm:h-52 lg:w-64 lg:h-64 flex items-center justify-center mb-6 lg:mb-8 animate-scale-up">
          <img
            src="/photo/logo.png"
            alt="Kin Yark Logo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Text */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-black mb-2 sm:mb-3 tracking-tight">
            Hello
          </h2>
          <p className="text-gray-700 text-sm sm:text-base font-semibold">
            You forgot your password ?
          </p>
        </div>
      </div>

      {/* ================= RIGHT / BOTTOM SIDE (Form) ================= */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-12 py-12 lg:py-0">
        <div className="w-full max-w-[420px] px-4">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center"
          >
            {/* Title */}
            <h1 className="text-3xl sm:text-[38px] font-serif font-normal text-black mb-10 sm:mb-14 lg:mb-16 text-center">
              Forgot Password
            </h1>

            {/* Email Field */}
            <div className="w-full relative mb-6">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full
                  h-[56px]
                  rounded-[16px]
                  border
                  border-[#D8D8D8]
                  bg-white
                  px-7
                  pr-14
                  text-sm sm:text-[16px]
                  text-black
                  placeholder:text-[#CFCFCF]
                  outline-none
                  focus:border-[#71B254]
                  transition-all
                  shadow-[0_4px_10px_rgba(0,0,0,0.08)]
                "
                required
              />

              {/* Mail Icon */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  width="18"
                  height="18"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
            </div>

            {/* ปุ่ม Back to Login */}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-gray-900 font-bold text-sm mb-6 md:mb-8 hover:underline transition-all bg-transparent border-none cursor-pointer"
            >
              Back to Login
            </button>

            {/* Send Button */}
            <button
              type="submit"
              className="
                w-full sm:w-44
                py-3
                bg-[#F5EFD7]
                text-gray-800
                font-extrabold
                text-base
                rounded-xl
                shadow-[0_4px_10px_rgba(0,0,0,0.06)]
                hover:bg-[#eae2c5]
                active:scale-95
                transition-all
                duration-200
                cursor-pointer
                text-center
              "
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}