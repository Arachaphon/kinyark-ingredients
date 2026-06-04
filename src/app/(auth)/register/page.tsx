'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signup } from './actions'
import PasswordInput from './PasswordInput'

export default function RegisterPage() {
  const [state, formAction] = useActionState(signup, { message: '' })

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form action={formAction} className="w-full max-w-sm space-y-4 p-8">
        <h1 className="text-2xl font-bold">Register</h1>

        {/* แสดง error message */}
        {state?.message && (
          <p className="text-red-500 text-sm text-center">{state.message}</p>
        )}

        <input name="username" type="text" placeholder="Username"
          className="w-full py-4.5 pl-6 pr-14 rounded-full border border-gray-200/80 bg-white text-gray-800 placeholder-gray-300 text-base focus:outline-none focus:border-[#71B254] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
          required
        />
        <input name="email" type="email" placeholder="Email"
          className="w-full py-4.5 pl-6 pr-14 rounded-full border border-gray-200/80 bg-white text-gray-800 placeholder-gray-300 text-base focus:outline-none focus:border-[#71B254] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
          required
        />
        <PasswordInput />

        <button type="submit"
          className="w-full bg-black text-white rounded p-2"
        >
          Register
        </button>
        <p className="text-center text-sm">
          Have an account already?{' '}
          <Link href="/login" className="underline">Login</Link>
        </p>
      </form>
    </div>
  )
}