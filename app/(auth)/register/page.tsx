'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    })
    if (error) return setError(error.message)
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4 p-8">
        <h1 className="text-2xl font-bold">สมัครสมาชิก</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          type="text"
          placeholder="ชื่อผู้ใช้"
          className="w-full border rounded p-2"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
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
          onClick={handleRegister}
          className="w-full bg-black text-white rounded p-2"
        >
          สมัครสมาชิก
        </button>
        <p className="text-center text-sm">
          มีบัญชีแล้ว?{' '}
          <a href="/login" className="underline">เข้าสู่ระบบ</a>
        </p>
      </div>
    </div>
  )
}