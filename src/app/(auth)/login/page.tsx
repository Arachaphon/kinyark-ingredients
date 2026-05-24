'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return setError(error.message)
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4 p-8">
        <h1 className="text-2xl font-bold">เข้าสู่ระบบ</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          type="email"
          placeholder="อีเมล"
          className="w-full border rounded p-2"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="รหัสผ่าน"
          className="w-full border rounded p-2"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button
          onClick={handleLogin}
          className="w-full bg-black text-white rounded p-2"
        >
          เข้าสู่ระบบ
        </button>
        <p className="text-center text-sm">
          ยังไม่มีบัญชี?{' '}
          <a href="/register" className="underline">สมัครสมาชิก</a>
        </p>
      </div>
    </div>
  )
}