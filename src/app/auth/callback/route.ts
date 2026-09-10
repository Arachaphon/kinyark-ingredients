import { createClient } from '@/lib/supabase/server'
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

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      errorRedirect = error.message
    }
  }

  if (errorRedirect) {
    // ลิงก์รีเซ็ตรหัสผ่านที่หมดอายุ/ใช้ไม่ได้ ให้กลับไปขอใหม่แทนหน้า login
    const errorPath = next === '/resetpassword' ? '/forgotpassword' : '/login'
    return NextResponse.redirect(`${origin}${errorPath}?error=${encodeURIComponent(errorRedirect)}`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
