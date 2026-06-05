"use client";

// 🛠️ แก้ไขจุดที่ 1: อิมพอร์ต React ให้เต็มระบบเพื่อเคลียร์บั๊กไทป์ และดึง useRouter มารอเปลี่ยนหน้า
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter(); // 🌟 รูเตอร์สำหรับเปลี่ยนหน้า

  // 🛠️ แก้ไขจุดที่ 2: เปลี่ยนมาใช้ React.SyntheticEvent ครอบจักรวาลตามมาตรฐานของทีมเรา
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();

    console.log({
      password,
      confirmPassword,
    });
    
    // TODO: Supabase Reset Password
    // พออัปเดตรหัสผ่านเสร็จจริง สามารถสั่ง router.push("/login") ตรงนี้ได้เลยครับ 🚀
  };

  return (
    // 📱 ปรับ flex-col สำหรับมือถือ และ lg:flex-row สำหรับจอใหญ่เดสก์ท็อป
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
          
          /* 🛠️ แก้ไขจุดที่ 3: แทนที่ระบบ inline style ด้วย Tailwind Classes มิติความโค้งจะสลับทิศทางตามขนาดหน้าจอโดยอัตโนมัติ */
          rounded-br-[50%/30px] lg:rounded-br-[35%/100%]
          rounded-bl-[50%/30px] lg:rounded-bl-0
          rounded-tr-0 lg:rounded-tr-[35%/100%]
        "
      >
        {/* ปรับขนาดโลโก้ให้ยืดหยุ่นตามหน้าจอ */}
        <div className="w-44 h-44 sm:w-52 sm:h-52 lg:w-64 lg:h-64 flex items-center justify-center mb-6 lg:mb-8 animate-scale-up">
          <img 
            src="/photo/logo.png" 
            alt="Kin Yark Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-black mb-2 sm:mb-3 tracking-tight">
            Hello
          </h2>
          <p className="text-gray-700 text-sm sm:text-base font-semibold mb-2 lg:mb-6">
            You forgot your password ?
          </p>
        </div>
      </div>

      {/* ================= RIGHT / BOTTOM SIDE (Form) ================= */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-12 py-12 lg:py-0">
        <div className="w-full max-w-[420px]">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center"
          >
            {/* Title - ลดขนาดและระยะห่างลงบนจอมือถือเพื่อให้กระชับขึ้น */}
            <h1 className="text-3xl sm:text-[38px] font-serif font-normal text-black mb-8 sm:mb-12 lg:mb-16 text-center">
              Reset Password
            </h1>

            {/* Password Field */}
            <div className="w-full relative mb-6 sm:mb-8">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[56px] pl-7 pr-14 rounded-[16px] border border-[#D8D8D8] bg-white text-black placeholder:text-[#CFCFCF] text-sm sm:text-base focus:outline-none focus:border-[#71B254] transition-all shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>

            {/* Confirm Password Field */}
            <div className="w-full relative mb-6">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-[56px] pl-7 pr-14 rounded-[16px] border border-[#D8D8D8] bg-white text-black placeholder:text-[#CFCFCF] text-sm sm:text-base focus:outline-none focus:border-[#71B254] transition-all shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
                required
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors focus:outline-none"
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>

            {/* ปุ่มกดหักพวงมาลัยเลี้ยวกลับหน้าล็อกอิน */}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-gray-900 font-bold text-sm mb-6 md:mb-10 hover:underline transition-all bg-transparent border-none cursor-pointer"
            >
              Back to Login
            </button>

            {/* Confirm Button */}
            <button
              type="submit"
              className="w-full sm:w-44 py-3 bg-[#F5EFD7] text-gray-800 font-extrabold text-base rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.06)] hover:bg-[#eae2c5] active:scale-95 transition-all duration-200 text-center cursor-pointer"
            >
              Confirm
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}