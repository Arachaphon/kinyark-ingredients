"use client";

// 🛠️ อิมพอร์ต React, useRouter และ Google Font (Anuphan)
import Image from "next/image";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Anuphan } from "next/font/google";

const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // เพิ่ม state สำหรับจัดการข้อความ Error เพื่อใช้แสดงผลบน UI สไตล์เดียวกับหน้า Login
  const [errorMessage, setErrorMessage] = useState("");
  
  const router = useRouter(); // 🌟 รูเตอร์สำหรับเปลี่ยนหน้า

  // 🛠️ เปลี่ยนมาใช้ React.SyntheticEvent ครอบจักรวาลตามมาตรฐานของทีมเรา
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMessage(""); // รีเซ็ตข้อความแจ้งเตือนทุกครั้งที่กด Submit

    // 1. ตรวจสอบเงื่อนไขความปลอดภัยของรหัสผ่าน (พิมพ์ใหญ่ 1, พิมพ์เล็ก 1, ตัวเลข 1, อักษรพิเศษ 1, ยาวอย่างน้อย 8 ตัว)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < 8 || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setErrorMessage("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร และประกอบด้วยตัวพิมพ์ใหญ่, ตัวพิมพ์เล็ก, ตัวเลข และอักขระพิเศษอย่างละ 1 ตัว");
      return;
    }

    // 2. ตรวจสอบว่ารหัสผ่านทั้งสองช่องตรงกันหรือไม่
    if (password !== confirmPassword) {
      setErrorMessage("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    console.log({
      password,
      confirmPassword,
    });
    
    // TODO: Supabase Reset Password
    // พออัปเดตรหัสผ่านเสร็จจริง สามารถสั่ง router.push("/login") ตรงนี้ได้เลยครับ 🚀
  };

  return (
    // ครอบด้วยคลาส className={`${anuphan.className}`} เพื่อเปิดใช้งานฟอนต์ Anuphan ทั่วทั้งหน้าเว็บ
    <div className={`${anuphan.className} flex min-h-screen w-full bg-white flex-col md:flex-row overflow-x-hidden relative`}>
      
      {/* ---------------- แผงโค้งมนสีครีม (เดสก์ท็อป) ---------------- */}
      <div
        className="hidden md:flex absolute top-0 left-0 h-full w-[45%] bg-[#F5ECD7] flex-col items-center justify-center p-12 rounded-r-[40%_50%] transition-all duration-700 ease-in-out"
      >
        <div className="flex flex-col items-center text-center max-w-sm">
          {/* ขยายขนาดกล่อง Container ขึ้นพร้อมใส่ scale-110 (ถอดบล็อกจากหน้า Login) */}
          <div className="w-72 h-72 xl:w-80 xl:h-80 mb-8 relative flex items-center justify-center scale-110 transition-all duration-300">
            <Image 
              src="/photo/logo.png" 
              alt="Kin Yark Logo" 
              fill 
              className="object-contain animate-scale-up" 
            />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-black mb-3 tracking-tight">สวัสดี ยินดีต้อนรับ</h2>
          <p className="text-gray-700 text-base font-semibold mb-6">คุณต้องการตั้งรหัสผ่านใหม่ใช่ไหม ?</p>
        </div>
      </div>

      {/* ---------------- ฟอร์มกรอกข้อมูล ---------------- */}
      <div
        className="w-full md:w-[55%] md:ml-auto flex flex-col items-center justify-center p-6 sm:p-10 md:p-16 z-10 py-16 transition-all duration-700 ease-in-out"
      >
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[380px] flex flex-col items-center"
        >
          {/* ขนาดโลโก้เวอร์ชันมือถือ (ถอดจากหน้า Login) */}
          <div className="md:hidden w-48 h-48 sm:w-56 sm:h-56 mb-4 flex items-center justify-center scale-105 transition-all relative">
            <Image src="/photo/logo.png" alt="Kin Yark Logo" fill className="object-contain" />
          </div>

          <h1 className="text-3xl md:text-4xl text-gray-900 mb-8 md:mb-12 tracking-wide font-medium">
            รีเซ็ตรหัสผ่าน
          </h1>

          {/* กล่องข้อความแจ้งเตือน Error สไตล์เดียวกับหน้า Login */}
          {errorMessage && (
            <p className="text-red-500 text-sm text-center mb-5 font-semibold bg-red-50 px-4 py-3 rounded-lg w-full border border-red-100 animate-fade-in leading-relaxed">
              {errorMessage}
            </p>
          )}

          <div className="w-full space-y-5 mb-5">
            {/* Password Field */}
            <div className="relative shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-full">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="รหัสผ่านใหม่"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#FBFBFB] border border-gray-100 rounded-full py-3.5 pl-6 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-amber-200 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 17.772 17.772m-10.46-10.46a4.5 4.5 0 0 0 6.364 6.364m-6.364-6.364a4.5 4.5 0 0 1 6.364 6.364" />
                  </svg>
                )}
              </button>
            </div>

            {/* Confirm Password Field */}
            <div className="relative shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-full">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="ยืนยันรหัสผ่านใหม่"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#FBFBFB] border border-gray-100 rounded-full py-3.5 pl-6 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-amber-200 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 17.772 17.772m-10.46-10.46a4.5 4.5 0 0 0 6.364 6.364m-6.364-6.364a4.5 4.5 0 0 1 6.364 6.364" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="button" 
            onClick={() => router.push("/login")}
            className="text-gray-900 font-bold text-sm mb-6 md:mb-8 hover:underline transition-all bg-transparent border-none cursor-pointer"
          >
            กลับสู่หน้าเข้าสู่ระบบ
          </button>

          <button
            type="submit"
            className="w-44 py-2.5 bg-[#EFE7D3] hover:bg-[#e4dcbf] text-gray-800 font-extrabold text-base rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.06)] active:scale-95 transition-all duration-200 text-center cursor-pointer"
          >
            ยืนยัน
          </button>
        </form>
      </div>
    </div>
  );
}