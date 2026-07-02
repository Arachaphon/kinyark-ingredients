"use client";

import { Anuphan } from "next/font/google";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { signup } from "./actions";

const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

export default function RegisterPage() {
  const [state, formAction] = useActionState(signup, { message: "" });
  const [clientError, setClientError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setClientError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password.length < 8) {
      e.preventDefault();
      setClientError("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
      return;
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
      e.preventDefault();
      setClientError(
        "รหัสผ่านต้องมีอักษรตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว ตัวพิมพ์เล็ก 1 ตัว ตัวเลข 1 ตัว และอักขระพิเศษ 1 ตัว"
      );
      return;
    }

    if (password !== confirmPassword) {
      e.preventDefault();
      setClientError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    // ผ่านการตรวจสอบฝั่ง client แล้ว เก็บอีเมลไว้ใช้ตอน redirect
    setSubmittedEmail(email);
  };

  // เมื่อ signup สำเร็จ (server action คืนค่า success: true) ให้ไปหน้าตรวจสอบอีเมล
  useEffect(() => {
    if (state?.success) {
      router.push(`/check-email?email=${encodeURIComponent(submittedEmail)}`);
    }
  }, [state, submittedEmail, router]);

  const handleGoToLogin = () => {
    if (window.innerWidth < 768) {
      router.push("/login");
    } else {
      setIsSliding(true);
      setTimeout(() => {
        router.push("/login");
      }, 700);
    }
  };

  return (
    <div
      className={`flex min-h-screen w-full bg-white flex-col md:flex-row overflow-x-hidden relative ${anuphan.className}`}
    >
      {/* ---------------- ฟอร์มสมัครสมาชิก ---------------- */}
      <div
        className={`w-full md:w-[55%] md:mr-auto flex flex-col items-center justify-center p-6 sm:p-10 md:p-16 z-10 py-16 transition-all duration-700 ease-in-out ${
          isSliding ? "translate-x-[81%] opacity-0" : "translate-x-0"
        }`}
      >
        <form
          onSubmit={handleSubmit}
          action={formAction}
          className="w-full max-w-[420px] flex flex-col items-center"
        >
          <div className="md:hidden w-48 h-48 sm:w-56 sm:h-56 mb-4 flex items-center justify-center scale-105 transition-all">
            <img
              src="/photo/logo.png"
              alt="Kin Yark Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <h1 className=" text-3xl md:text-4xl text-gray-900 mb-12 tracking-wide font-medium">
            ลงทะเบียน
          </h1>

          <div className="w-full relative shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-full border border-gray-200/80 bg-white group focus-within:ring-1 focus-within:ring-amber-200 transition-all mb-5">
            <select
              name="role"
              className="w-full py-3.5 px-6 rounded-full bg-white text-gray-700 text-base focus:outline-none transition-all cursor-pointer appearance-none"
              required
            >
              <option value="" disabled selected>เลือกสถานะการใช้งาน</option>
              <option value="user">คนทั่วไป</option>
              <option value="shop">ร้านค้า</option>
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-amber-400">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
            </div>
          </div>
          {clientError && (
            <p className="text-red-500 text-sm mb-4 bg-red-50 px-4 py-2 rounded-lg w-full text-center font-semibold border border-red-200 animate-fade-in">
              {clientError}
            </p>
          )}

          {state?.message && !clientError && (
            <p className="text-red-500 text-sm mb-4 bg-red-50 px-4 py-2 rounded-lg w-full text-center font-semibold border border-red-200">
              {state.message}
            </p>
          )}

          <div className="w-full space-y-5">
            {/* Username */}
            <div className="relative shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-full">
              <input
                name="username"
                type="text"
                placeholder="ชื่อผู้ใช้"
                className="w-full py-3.5 pl-6 pr-12 rounded-full border border-gray-200/80 bg-white text-gray-800 placeholder-gray-300 text-base focus:outline-none focus:ring-1 focus:ring-amber-200 transition-all"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              </span>
            </div>

            {/* Email */}
            <div className="relative shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-full">
              <input
                name="email"
                type="email"
                placeholder="อีเมล"
                className="w-full py-3.5 pl-6 pr-12 rounded-full border border-gray-200/80 bg-white text-gray-800 placeholder-gray-300 text-base focus:outline-none focus:ring-1 focus:ring-amber-200 transition-all"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
              </span>
            </div>

            {/* Password */}
            <div className="relative shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-full">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="รหัสผ่าน"
                className="w-full py-3.5 pl-6 pr-12 rounded-full border border-gray-200/80 bg-white text-gray-800 placeholder-gray-300 text-base focus:outline-none focus:ring-1 focus:ring-amber-200 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                    />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 17.772 17.772m-10.46-10.46a4.5 4.5 0 0 0 6.364 6.364m-6.364-6.364a4.5 4.5 0 0 1 6.364 6.364"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-full">
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="ยืนยันรหัสผ่าน"
                className="w-full py-3.5 pl-6 pr-12 rounded-full border border-gray-200/80 bg-white text-gray-800 placeholder-gray-300 text-base focus:outline-none focus:ring-1 focus:ring-amber-200 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showConfirmPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                    />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 17.772 17.772m-10.46-10.46a4.5 4.5 0 0 0 6.364 6.364m-6.364-6.364a4.5 4.5 0 0 1 6.364 6.364"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-44 py-2.5 mt-8 md:mt-12 bg-[#EFE7D3] hover:bg-[#e4dcbf] text-gray-800 font-extrabold text-base rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.06)] active:scale-95 transition-all duration-200 text-center cursor-pointer"
          >
            สมัครสมาชิก
          </button>

          <p className="md:hidden mt-6 text-sm text-gray-600 font-medium">
            มีบัญชีอยู่แล้วใช่ไหม ?{" "}
            <button
              type="button"
              onClick={handleGoToLogin}
              className="text-amber-700 font-bold underline"
            >
              เข้าสู่ระบบ
            </button>
          </p>
        </form>
      </div>

      {/* ---------------- แผงโค้งมนสีครีม (โชว์เฉพาะบนคอมพิวเตอร์ md:) ---------------- */}
      <div
        className={`hidden md:flex absolute top-0 right-0 h-full w-[45%] bg-[#F5ECD7] flex-col items-center justify-center p-12 transition-all duration-700 ease-in-out ${
          isSliding
            ? "translate-x-[-122%] rounded-l-none rounded-r-[40%_50%]"
            : "rounded-l-[40%_50%]"
        }`}
      >
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="w-72 h-72 xl:w-80 xl:h-80 mb-8 relative flex items-center justify-center scale-110 transition-all duration-300">
            <img
              src="/photo/logo.png"
              alt="Kin Yark Ingredients Logo"
              className="w-full h-full object-contain animate-scale-up"
            />
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold text-black mb-3 tracking-tight">
            ยินดีต้อนรับกลับ!
          </h2>
          <p className="text-gray-700 text-base font-semibold mb-6">
            มีบัญชีอยู่แล้วใช่ไหม ?
          </p>
          <button
            type="button"
            onClick={handleGoToLogin}
            className="w-44 py-2.5 bg-white hover:bg-gray-50 text-gray-800 font-bold text-base rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.05)] transition-all duration-200"
          >
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    </div>
  );
}