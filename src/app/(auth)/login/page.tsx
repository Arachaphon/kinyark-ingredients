"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  // 🌟 State สำหรับการจัดการฟอร์ม
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // 🌟 State สำหรับสลับ เปิด/ปิด ตารหัสผ่าน
  const [showPassword, setShowPassword] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("กำลังเข้าสู่ระบบด้วย:", { usernameOrEmail, password });
    // คุณสามารถเชื่อมต่อฟังก์ชันเข้าสู่ระบบของ Supabase ต่อที่ตรงนี้ได้เลยครับ!
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col md:flex-row overflow-x-hidden">
      
      {/* =========================================
          🎯 ฝั่งซ้าย: ซุ้มโค้งสีครีม (Welcome Sidebar)
          ========================================= */}
      <div className="w-full md:w-[42%] bg-[#F5EFD7] rounded-b-[60px] md:rounded-b-none md:rounded-r-[120px_100%] flex flex-col items-center justify-center py-12 px-6 shrink-0 shadow-[4px_0_20px_rgba(0,0,0,0.02)]">
        
        {/* ดึงภาพโลโก้มาแสดงผล */}
        <div className="w-48 h-48 flex items-center justify-center mb-8 animate-scale-up">
          <img 
            src="/photo/logo.png" 
            alt="Kin Yark Logo" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* ข้อความต้อนรับ */}
        <h2 className="text-3xl md:text-4xl font-extrabold text-black mb-3 tracking-tight">
          Hello, Welcome
        </h2>
        <p className="text-gray-700 text-base font-semibold mb-6">
          Don’t have an account ?
        </p>

        {/* ปุ่มลิงก์สลับไปสมัครสมาชิก */}
        <Link 
          href="/register" 
          className="w-44 py-2.5 bg-white text-gray-800 font-bold text-base rounded-xl text-center shadow-[0_4px_10px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          Register
        </Link>
      </div>

      {/* =========================================
          🎯 ฝั่งขวา: ฟอร์มกรอกข้อมูลการล็อกอิน (Login Form)
          ========================================= */}
      <div className="flex-grow flex flex-col items-center justify-center py-16 px-6 bg-white">
        
        <form onSubmit={handleLoginSubmit} className="w-full max-w-[420px] flex flex-col items-center">
          
          {/* หัวข้อล็อกอินแนว Serif คลาสสิก */}
          <h1 className="font-serif text-3xl md:text-4xl text-gray-900 mb-12 tracking-wide font-medium">
            Login
          </h1>

          {/* ช่องกรอก Username/Email */}
          <div className="w-full relative mb-6">
            <input 
              type="text"
              placeholder="Username/Email"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              className="w-full py-4.5 pl-6 pr-14 rounded-full border border-gray-200/80 bg-white text-gray-800 placeholder-gray-300 text-base focus:outline-none focus:border-[#71B254] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
              required
            />
            {/* ไอคอนรูปคน */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-900">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
              </svg>
            </div>
          </div>

          {/* ช่องกรอก Password */}
          <div className="w-full relative mb-5">
            <input 
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-4.5 pl-6 pr-14 rounded-full border border-gray-200/80 bg-white text-gray-800 placeholder-gray-300 text-base focus:outline-none focus:border-[#71B254] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
              required
            />
            
            {/* 👁️ ปุ่มรูปลูกตา: คลิกเพื่อสลับเปิด-ปิด เพื่อดูรหัสผ่าน */}
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-800 hover:text-black transition-colors focus:outline-none"
            >
              {showPassword ? (
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              ) : (
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              )}
            </button>
          </div>

          {/* ลิงก์ลืมรหัสผ่าน */}
          <Link 
            href="/forgot-password" 
            className="text-gray-900 font-bold text-sm mb-8 hover:underline transition-all"
          >
            Forgot Password
          </Link>

          {/* ปุ่มส่งข้อมูล Login */}
          <button 
            type="submit"
            className="w-44 py-2.5 bg-[#F5EFD7] text-gray-800 font-extrabold text-base rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.06)] hover:bg-[#eae2c5] active:scale-95 transition-all duration-200 text-center cursor-pointer"
          >
            Login
          </button>

        </form>
      </div>

    </div>
  );
}