"use client";

import { useState } from "react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log({
      password,
      confirmPassword,
    });
  };

  return (
    <div className="min-h-screen flex bg-[#F7F7F7] overflow-hidden">
      {/* ================= LEFT SIDE ================= */}
      <div
        className="
          w-[45%]
          min-h-screen
          bg-[#F5EFD7]
          flex
          flex-col
          items-center
          justify-center
          px-8
          shrink-0
        "
        style={{
          borderTopRightRadius: "35% 100%",
          borderBottomRightRadius: "35% 100%",
        }}
      >
        <div className="w-48 h-48 flex items-center justify-center mb-8 animate-scale-up">
          <img 
            src="/photo/logo.png" 
            alt="Kin Yark Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        
          <h2 className="text-3xl md:text-4xl font-extrabold text-black mb-3 tracking-tight">
            Hello
          </h2>

          <p className="text-gray-700 text-base font-semibold mb-6">
            You forgot your password ?
          </p>
        
      </div>

      {/* ================= RIGHT SIDE ================= */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[420px]">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center"
          >
            {/* Title */}
            <h1 className="text-[38px] font-serif font-normal text-black mb-16">
              Reset Password
            </h1>

            {/* Password */}
            <div className="w-full relative mb-8">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  w-full py-4.5 pl-6 pr-14 rounded-full border border-gray-200/80 bg-white text-gray-800 placeholder-gray-300 text-base focus:outline-none focus:border-[#71B254] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
              required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="
                  absolute
                  right-5
                  top-1/2
                  -translate-y-1/2
                  text-black
                "
              >
                {showPassword ? (
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="w-full relative mb-14">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                className="
                  w-full py-4.5 pl-6 pr-14 rounded-full border border-gray-200/80 bg-white text-gray-800 placeholder-gray-300 text-base focus:outline-none focus:border-[#71B254] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
              required
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                className="
                  absolute
                  right-5
                  top-1/2
                  -translate-y-1/2
                  text-black
                "
              >
                {showConfirmPassword ? (
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>

            {/* Confirm Button */}
            <button
              type="submit"
              className="
               w-44 py-2.5 bg-[#F5EFD7] text-gray-800 font-extrabold text-base rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.06)] hover:bg-[#eae2c5] active:scale-95 transition-all duration-200 text-center cursor-pointer"
          >
              Confirm
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}