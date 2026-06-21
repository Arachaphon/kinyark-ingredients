"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; 
// --- ดึงระบบฝั่งหลังบ้านของเพื่อนมาเชื่อมต่อ (SERVER ACTION) ---
import { useActionState } from 'react';
import { login } from "./actions";

export default function LoginPage() {
  // --- ผูกระบบป้อนข้อมูลของเพื่อนเข้ากับหน้าเว็บของเรา ---
  const [state, formAction] = useActionState(login, { message: "" });

  // --- เก็บสเตตัสและแอนิเมชันเดิมของเราไว้ครบถ้วน ---
  const [showPassword, setShowPassword] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const router = useRouter();

  const handleGoToRegister = () => {
    if (window.innerWidth < 768) {
      router.push("/register");
    } else {
      setIsSliding(true);
      setTimeout(() => {
        router.push("/register");
      }, 700);
    }
  };

  return (
    // โครงสร้างหลักคุมสไตล์ Tailwind ดั้งเดิมของเรา
    <div className="flex min-h-screen w-full bg-white flex-col md:flex-row overflow-x-hidden relative font-sans">

      {/* ---------------- แผงโค้งมนสีครีม (เดสก์ท็อป) ---------------- */}
      <div
        className={`hidden md:flex absolute top-0 left-0 h-full w-[45%] bg-[#F5ECD7] flex-col items-center justify-center p-12 transition-all duration-700 ease-in-out ${
          isSliding
            ? "translate-x-[122%] rounded-r-none rounded-l-[40%_50%]"
            : "rounded-r-[40%_50%]"
        }`}
      >
        <div className="flex flex-col items-center text-center max-w-sm">
          {/* 🛠️ แก้ไขจุดนี้: ขยายขนาดกล่อง Container ขึ้นเป็น w-72 h-72 / xl:w-80 xl:h-80 พร้อมใส่ scale-110 ขยายตัวเด่นสะใจถอดบล็อกจากหน้า Home เลยครับ */}
          <div className="w-72 h-72 xl:w-80 xl:h-80 mb-8 relative flex items-center justify-center scale-110 transition-all duration-300">
            <img src="/photo/logo.png" alt="Kin Yark Logo" className="w-full h-full object-contain animate-scale-up" />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-black mb-3 tracking-tight">Hello, Welcome</h2>
          <p className="text-gray-700 text-base font-semibold mb-6">Don’t have an account ?</p>
          <button type="button" onClick={handleGoToRegister} className="w-44 py-2.5 bg-white text-gray-800 font-bold text-base rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
            Register
          </button>
        </div>
      </div>

      {/* ---------------- ฟอร์มกรอกข้อมูลล็อกอิน ---------------- */}
      <div
        className={`w-full md:w-[55%] md:ml-auto flex flex-col items-center justify-center p-6 sm:p-10 md:p-16 z-10 py-16 transition-all duration-700 ease-in-out ${
          isSliding ? "-translate-x-[81%] opacity-0" : "translate-x-0"
        }`}
      >
        <form
          action={formAction}
          className="w-full max-w-[380px] flex flex-col items-center"
        >
          {/* 🛠️ แก้ไขจุดนี้: ขยายขนาดโลโก้เวอร์ชันมือถือให้เด่นและชัดเจนขึ้นเท่าๆ กับหน้าสมัครสมาชิก */}
          <div className="md:hidden w-48 h-48 sm:w-56 sm:h-56 mb-4 flex items-center justify-center scale-105 transition-all">
            <img src="/photo/logo.png" alt="Kin Yark Logo" className="w-full h-full object-contain" />
          </div>

          <h1 className="font-serif text-3xl md:text-4xl text-gray-900 mb-8 md:mb-12 tracking-wide font-medium">
            Login
          </h1>

          {/* กล่องข้อความแจ้งเตือน Error จากหลังบ้าน */}
          {state?.message && (
            <p className="text-red-500 text-sm text-center mb-5 font-semibold bg-red-50 px-4 py-2 rounded-lg w-full border border-red-100 animate-fade-in">
              {state.message}
            </p>
          )}

          <div className="w-full space-y-5 mb-5">
            {/* Username/Email */}
            <div className="relative shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-full">
              <input
                name="email"
                type="text"
                placeholder="Username/Email"
                className="w-full bg-[#FBFBFB] border border-gray-100 rounded-full py-3.5 pl-6 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-amber-200 transition-all"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </span>
            </div>

            {/* Password */}
            <div className="relative shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-full">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
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
          </div>

          <Link
            href="/forgotpassword"
            className="text-gray-900 font-bold text-sm mb-6 md:mb-8 hover:underline transition-all bg-transparent border-none cursor-pointer"
          >
            Forgot Password
          </Link>

          <button
            type="submit"
            className="w-44 py-2.5 bg-[#EFE7D3] hover:bg-[#e4dcbf] text-gray-800 font-extrabold text-base rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.06)] active:scale-95 transition-all duration-200 text-center cursor-pointer"
          >
            Login
          </button>

          <p className="md:hidden mt-6 text-sm text-gray-600 font-medium">
            {"Don't have an account? "}
            <button type="button" onClick={handleGoToRegister} className="text-amber-700 font-bold underline">
              Register
            </button>
          </p>

        </form>
      </div>
    </div>
  );
}