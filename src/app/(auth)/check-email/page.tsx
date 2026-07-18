"use client";

import Image from "next/image";
import { Anuphan } from "next/font/google";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

function CheckEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const supabase = createClient();

  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    setResendMessage("");

    try {
      // TODO: เชื่อมกับ API ส่งอีเมลยืนยันอีกครั้ง
      // await fetch("/api/resend-verification", {
      //   method: "POST",
      //   body: JSON.stringify({ email }),
      // });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      setResendMessage("ส่งอีเมลยืนยันอีกครั้งเรียบร้อยแล้ว");
    } catch {
      setResendMessage("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsResending(false);
    }
  };

  return (
      <div className="w-full max-w-[440px] flex flex-col items-center text-center">
        <div className="w-72 h-72 xl:w-80 xl:h-80 mb-6 flex items-center justify-center relative">
          <Image
            src="/photo/logo.png"
            alt="Kin Yark Logo"
            fill
            className="object-contain"
          />
        </div>

        {/* ไอคอนซองจดหมาย */}
        <div className="w-20 h-20 rounded-full bg-[#F5ECD7] flex items-center justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-9 h-9 text-amber-700"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
            />
          </svg>
        </div>

        <h1 className="text-2xl md:text-3xl text-gray-900 mb-3 tracking-wide font-medium">
          ตรวจสอบอีเมลของคุณ
        </h1>

        <p className="text-gray-600 text-base mb-1">
          เราได้ส่งลิงก์ยืนยันตัวตนไปที่
        </p>
        {email && (
          <p className="text-gray-900 text-base font-semibold mb-6 break-all">
            {email}
          </p>
        )}
        {!email && <div className="mb-6" />}

        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          กรุณาคลิกลิงก์ในอีเมลเพื่อยืนยันบัญชีของคุณ
          หากไม่พบอีเมล ลองตรวจสอบในโฟลเดอร์สแปมหรือถังขยะ
        </p>

        {resendMessage && (
          <p className="text-sm mb-4 bg-[#F5ECD7]/60 px-4 py-2 rounded-lg w-full text-center font-semibold text-amber-800 border border-amber-100 animate-fade-in">
            {resendMessage}
          </p>
        )}

        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="w-full py-3.5 bg-[#EFE7D3] hover:bg-[#e4dcbf] disabled:opacity-60 disabled:cursor-not-allowed text-gray-800 font-extrabold text-base rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.06)] active:scale-95 transition-all duration-200 cursor-pointer"
        >
          {isResending ? "กำลังส่ง..." : "ส่งอีเมลยืนยันอีกครั้ง"}
        </button>

        <button
          type="button"
          onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
          className="mt-6 text-sm text-amber-700 font-bold underline"
        >
          กลับไปหน้าเข้าสู่ระบบ
        </button>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <div
      className={`flex min-h-screen w-full bg-white items-center justify-center p-6 ${anuphan.className}`}
    >
      <Suspense fallback={<div />}>
        <CheckEmailContent />
      </Suspense>
    </div>
  );
}