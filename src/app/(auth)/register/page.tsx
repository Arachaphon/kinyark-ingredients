'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSliding, setIsSliding] = useState(false)
  const router = useRouter()

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      return setError('รหัสผ่านไม่ตรงกัน')
    }
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username }),
    })
    const data = await res.json()
    if (!res.ok) return setError(data.error)
    router.push('/login')
  }

  const handleGoToLogin = () => {
    if (window.innerWidth < 768) {
      router.push('/login')
    } else {
      setIsSliding(true)
      setTimeout(() => {
        router.push('/login')
      }, 700)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-white overflow-hidden relative font-sans">
      
      {/* ---------------- ฟอร์มสมัครสมาชิก ---------------- */}
      <div 
        className={`w-full md:w-[55%] flex flex-col items-center justify-center p-6 sm:p-10 md:p-16 z-10 transition-all duration-700 ease-in-out ${
          isSliding ? 'translate-x-[81%] opacity-0' : 'translate-x-0'
        }`}
      >
        <div className="w-full max-w-[420px] flex flex-col items-center">
          
          {/* 🔍 📍 ปรับขนาดโลโก้เวอร์ชันมือถือเพิ่มเป็น w-44 h-44 */}
          <div className="md:hidden w-44 h-44 mb-4 flex items-center justify-center">
            <img src="/photo/logo.png" alt="Kin Yark Logo" className="w-full h-full object-contain" />
          </div>

          <h1 className="font-serif text-3xl md:text-4xl text-gray-900 mb-12 tracking-wide font-medium">
            Registration
          </h1>
          
          {error && <p className="text-red-500 text-sm mb-4 bg-red-50 px-4 py-2 rounded-lg w-full text-center">{error}</p>}
          
          <div className="w-full space-y-5">
            {/* Username */}
            <div className="relative shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-full">
              <input
                type="text"
                placeholder="Username"
                className="w-full py-3.5 pl-6 pr-12 rounded-full border border-gray-200/80 bg-white text-gray-800 placeholder-gray-300 text-base focus:outline-none focus:ring-1 focus:ring-amber-200 transition-all"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </span>
            </div>

            {/* Email */}
            <div className="relative shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-full">
              <input
                type="email"
                placeholder="Email"
                className="w-full py-3.5 pl-6 pr-12 rounded-full border border-gray-200/80 bg-white text-gray-800 placeholder-gray-300 text-base focus:outline-none focus:ring-1 focus:ring-amber-200 transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </span>
            </div>

            {/* Password */}
            <div className="relative shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-full">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full py-3.5 pl-6 pr-12 rounded-full border border-gray-200/80 bg-white text-gray-800 placeholder-gray-300 text-base focus:outline-none focus:ring-1 focus:ring-amber-200 transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
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

            {/* Confirm Password */}
            <div className="relative shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-full">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                className="w-full py-3.5 pl-6 pr-12 rounded-full border border-gray-200/80 bg-white text-gray-800 placeholder-gray-300 text-base focus:outline-none focus:ring-1 focus:ring-amber-200 transition-all"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showConfirmPassword ? (
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

          <button
            onClick={handleRegister}
            className="w-44 py-2.5 mt-8 md:mt-12 bg-[#EFE7D3] hover:bg-[#e4dcbf] text-gray-800 font-extrabold text-base rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.06)] active:scale-95 transition-all duration-200 text-center cursor-pointer"
          >
            Register
          </button>

          <p className="md:hidden mt-6 text-sm text-gray-600 font-medium">
            Already have an account?{" "}
            <button type="button" onClick={handleGoToLogin} className="text-amber-700 font-bold underline">
              Login
            </button>
          </p>
        </div>
      </div>

      {/* ---------------- แผงโค้งมนสีครีม (โชว์เฉพาะบนคอมพิวเตอร์ md:) ---------------- */}
      <div 
        className={`hidden md:flex absolute top-0 right-0 h-full w-[45%] bg-[#F5ECD7] flex-col items-center justify-center p-12 transition-all duration-700 ease-in-out ${
          isSliding 
            ? 'translate-x-[-122%] rounded-l-none rounded-r-[40%_50%]' 
            : 'rounded-l-[40%_50%]'
        }`}
      >
        <div className="flex flex-col items-center text-center max-w-sm">
          {/* 🔍 📍 ปรับขนาดกล่องโลโก้เพิ่มเป็น w-64 h-64 ใหญ่สะใจ */}
          <div className="w-64 h-64 mb-8 relative flex items-center justify-center">
            <img src="/photo/logo.png" alt="Kin Yark Ingredients Logo" className="w-full h-full object-contain animate-scale-up" />
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold text-black mb-3 tracking-tight">Welcome Back!</h2>
          <p className="text-gray-700 text-base font-semibold mb-6">Already have an account ?</p>
          <button onClick={handleGoToLogin} className="w-44 py-2.5 bg-white hover:bg-gray-50 text-gray-800 font-bold text-base rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.05)] transition-all duration-200">
            Login
          </button>
        </div>
      </div>

    </div>
  )
}