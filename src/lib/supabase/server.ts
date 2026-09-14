import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export type SupabaseCookieToSet = {
  name: string
  value: string
  options?: Parameters<NextResponse['cookies']['set']>[2]
}

export function applySupabaseCookies(
  response: NextResponse,
  cookiesToSet: SupabaseCookieToSet[]
): void {
  if (cookiesToSet.length === 0) return
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options)
  }
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

/**
 * สำหรับ Route Handler ที่ต้อง persist cookie ลง response (เช่น PKCE code verifier
 * ตอน resetPasswordForEmail และ session ตอน exchangeCodeForSession).
 * ใน Route Handler การ set ผ่าน `cookies()` อย่างเดียวไม่พอ ต้องเอา cookiesToSet
 * ไปแปะบน response ที่ return กลับไปด้วย — ดูตัวอย่างที่ logout route เคยทำถูกแล้ว.
 */
export async function createRouteHandlerClient() {
  const cookieStore = await cookies()
  let cookiesToSet: SupabaseCookieToSet[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookies) {
          cookiesToSet = cookies as SupabaseCookieToSet[]
          try {
            cookies.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // ใน Route Handler cookieStore.set อาจ throw — ยังเหลือ cookiesToSet ให้ caller แปะบน response
          }
        },
      },
    }
  )

  return {
    supabase,
    /** cookies ที่ Supabase ต้องการ persist — caller ต้อง apply ลง response ก่อน return */
    getCookiesToSet: (): SupabaseCookieToSet[] => cookiesToSet,
    applyTo: (response: NextResponse): NextResponse => {
      applySupabaseCookies(response, cookiesToSet)
      return response
    },
  }
}