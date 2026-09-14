import { createRouteHandlerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// อนุญาตเฉพาะ path ภายใน (กัน open-redirect ไปเว็บอื่น)
function getSafeNext(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/home'
  }
  return value
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = getSafeNext(searchParams.get('next'))
  let errorRedirect = searchParams.get('error_description')

  // ใช้ Route Handler client ที่ capture cookies — session ที่แลกได้ต้องถูกแปะ
  // ลง redirect response ไม่งั้น browser ไม่มี session แล้ว /resetpassword
  // จะมองว่าลิงก์ invalid แล้วโยนกลับไป /forgotpassword
  const { supabase, applyTo } = await createRouteHandlerClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      errorRedirect = error.message
    }
  }

  if (errorRedirect) {
    // ลิงก์รีเซ็ตรหัสผ่านที่หมดอายุ/ใช้ไม่ได้ ให้กลับไปขอใหม่แทนหน้า login
    const errorPath = next === '/resetpassword' ? '/forgotpassword' : '/login'
    return applyTo(NextResponse.redirect(`${origin}${errorPath}?error=${encodeURIComponent(errorRedirect)}`))
  }

  return applyTo(NextResponse.redirect(`${origin}${next}`))
}
