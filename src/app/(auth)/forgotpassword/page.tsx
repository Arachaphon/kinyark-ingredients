"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log({
      email,
    });

    // TODO: Supabase Reset Password
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
        {/* Logo */}
        <div className="w-48 h-48 flex items-center justify-center mb-8">
          <img
            src="/photo/logo.png"
            alt="Kin Yark Logo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Text */}
        <h2 className="text-3xl md:text-4xl font-extrabold text-black mb-3 tracking-tight">
          Hello
        </h2>

        <p className="text-gray-700 text-base font-semibold">
          You forgot your password ?
        </p>
      </div>

      {/* ================= RIGHT SIDE ================= */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[420px] px-4">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center"
          >
            {/* Title */}
            <h1 className="text-[38px] font-serif font-normal text-black mb-16">
              Forgot Password
            </h1>

            {/* Email */}
            <div className="w-full relative mb-10">
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
                  text-[16px]
                  text-black
                  placeholder:text-[#CFCFCF]
                  outline-none
                  shadow-[0_4px_10px_rgba(0,0,0,0.08)]
                "
                required
              />

              {/* Mail Icon */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-black">
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

            {/* Send Button */}
            <button
              type="submit"
              className="
                w-44
                py-2.5
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