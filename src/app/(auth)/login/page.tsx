"use client";

import { useActionState } from 'react'
import Link from "next/link";
import { login } from "./actions";
import PasswordInput from "./PasswordInput";

export default function LoginPage() {
  const [state, formAction] = useActionState(login, { message: "" });

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col md:flex-row overflow-x-hidden">
      {/* ฝั่งซ้าย */}
      <div className="w-full md:w-[42%] bg-[#F5EFD7] rounded-b-[60px] md:rounded-b-none md:rounded-r-[120px_100%] flex flex-col items-center justify-center py-12 px-6 shrink-0">
        <div className="w-48 h-48 flex items-center justify-center mb-8">
          <img
            src="/photo/logo.png"
            alt="Kin Yark Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-black mb-3 tracking-tight">
          Hello, Welcome
        </h2>
        <p className="text-gray-700 text-base font-semibold mb-6">
          Don't have an account ?
        </p>
        <Link
          href="/register"
          className="w-44 py-2.5 bg-white text-gray-800 font-bold text-base rounded-xl text-center shadow-[0_4px_10px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200"
        >
          Register
        </Link>
      </div>

      {/* ฝั่งขวา */}
      <div className="flex-grow flex flex-col items-center justify-center py-16 px-6 bg-white">
        <form action={formAction} className="w-full max-w-[420px] flex flex-col items-center">
          <h1 className="font-serif text-3xl md:text-4xl text-gray-900 mb-12 tracking-wide font-medium">
            Login
          </h1>
                    {state?.message && (
          <p className="text-red-500 text-sm text-center">{state.message}</p>
        )}
          {/* Email */}
          <div className="w-full relative mb-6">
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="w-full py-4.5 pl-6 pr-14 rounded-full border border-gray-200/80 bg-white text-gray-800 placeholder-gray-300 text-base focus:outline-none focus:border-[#71B254] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
              required
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-900">
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
              </svg>
            </div>
          </div>

          {/* Password — client component */}
          <PasswordInput />

          <Link
            href="/forgot-password"
            className="text-gray-900 font-bold text-sm mb-8 hover:underline"
          >
            forgot password?
          </Link>

          <button
            type="submit"
            className="w-44 py-2.5 bg-[#F5EFD7] text-gray-800 font-extrabold text-base rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.06)] hover:bg-[#eae2c5] active:scale-95 transition-all duration-200 cursor-pointer"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
