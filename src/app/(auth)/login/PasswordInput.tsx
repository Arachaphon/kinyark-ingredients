'use client'

import { useState } from 'react'

export default function PasswordInput() {
  const [show, setShow] = useState(false)

  return (
    <div className="w-full relative mb-5">
      <input
        name="password"
        type={show ? 'text' : 'password'}
        placeholder="Password"
        className="w-full py-4.5 pl-6 pr-14 rounded-full border border-gray-200/80 bg-white text-gray-800 placeholder-gray-300 text-base focus:outline-none focus:border-[#71B254] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
        required
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-800 hover:text-black transition-colors focus:outline-none"
      >
        {show ? (
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
  )
}