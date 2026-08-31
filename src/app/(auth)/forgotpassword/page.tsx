"use client";

import Image from "next/image";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Anuphan } from "next/font/google";
import { createClient } from "@/lib/supabase/client";

const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const router = useRouter(); 
  const supabase = createClient();

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    
    // 🌟 เรียกใช้งาน API หลังบ้าน (ที่เช็คผ่าน Schema) โดยปล่อยให้ทำงานอยู่เบื้องหลัง
    fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(console.error);
    
    // 🌟 เปลี่ยนหน้าไปเช็คอีเมลทันที ไม่รอโหลด เพื่อประสบการณ์ใช้งานที่ลื่นไหล
    router.push(`/check-email?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className={`${anuphan.className} flex min-h-screen w-full bg-white flex-col md:flex-row overflow-x-hidden relative`}>
      
      {/* ================= แผงโค้งมนสีครีม ================= */}
      <div
        className="hidden md:flex absolute top-0 left-0 h-full w-[45%] bg-[#F5ECD7] flex-col items-center justify-center p-12 rounded-r-[40%_50%] transition-all duration-300 ease-in-out"
      >
        <div className="w-72 h-72 xl:w-80 xl:h-80 mb-8 relative flex items-center justify-center scale-110 transition-all duration-300">
          <Image
            src="/photo/logo.png"
            alt="Kin Yark Logo"
            fill
            className="object-contain animate-scale-up"
          />
        </div>

        <div className="text-center max-w-sm">
          <h2 className="text-3xl md:text-4xl font-extrabold text-black mb-3 tracking-tight">
            สวัสดี
          </h2>
          <p className="text-gray-700 text-base font-semibold">
            คุณลืมรหัสผ่านใช่ไหม?
          </p>
        </div>
      </div>

      {/* ================= ฟอร์มกรอกข้อมูล ================= */}
      <div className="w-full md:w-[55%] md:ml-auto flex flex-col items-center justify-center p-6 sm:p-10 md:p-16 z-10 py-16 transition-all duration-300">
        <div className="w-full max-w-[380px] flex flex-col items-center">
          <form
            onSubmit={handleSubmit}
            className="w-full flex flex-col items-center"
          >
            <div className="md:hidden w-48 h-48 sm:w-56 sm:h-56 mb-4 flex items-center justify-center scale-105 transition-all relative">
              <Image
                src="/photo/logo.png"
                alt="Kin Yark Logo"
                fill
                className="object-contain"
              />
            </div>

            <h1 className=" text-3xl md:text-4xl text-gray-900 mb-8 md:mb-12 tracking-wide font-medium text-center">
              ลืมรหัสผ่าน
            </h1>

            <div className="w-full relative mb-5 space-y-5">
              <div className="relative shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-full">
                <input
                  type="email"
                  placeholder="อีเมล"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#FBFBFB] border border-gray-100 rounded-full py-3.5 pl-6 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-amber-200 transition-all"
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
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
            </div>

            <button
              type="button"
              onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
              className="text-gray-900 font-bold text-sm mb-6 md:mb-8 hover:underline transition-all bg-transparent border-none cursor-pointer"
            >
              กลับไปหน้า Login
            </button>

            <button
              type="submit"
              className="w-44 py-2.5 bg-[#EFE7D3] hover:bg-[#e4dcbf] text-gray-800 font-extrabold text-base rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.06)] active:scale-95 transition-all duration-200 text-center cursor-pointer"
            >
              ยืนยัน
            </button>

            <p className="md:hidden mt-6 text-sm text-gray-600 font-medium">
              {"Don't have an account?"}
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="text-amber-700 font-bold underline"
              >
                Register
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}