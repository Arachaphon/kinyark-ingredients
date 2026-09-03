import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { verifySupabaseJWT } from './lib/auth-jwt'

export async function proxy(request: NextRequest) {
  // 1. ลบ headers ลอกเลียนแบบจากฝั่ง Client เพื่อป้องกันการสวมรอย (Spoofing)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.delete('x-user-id')
  requestHeaders.delete('x-user-role')

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        },
      },
    }
  )

  // 2. ดึง session จากคุกกี้ท้องถิ่นเท่านั้น (0ms Network latency)
  const { data: { session } } = await supabase.auth.getSession()

  // 3. ตรวจสอบ JWT ลายเซ็นผ่านความลับเครื่อง (0ms Network latency)
  if (session?.access_token) {
    const verified = await verifySupabaseJWT(session.access_token)
    if (verified.userId) {
      requestHeaders.set('x-user-id', verified.userId)
      requestHeaders.set('x-user-role', verified.role)
    }
  }

  // 4. ตรวจสอบการเข้าถึงเส้นทางที่ต้องล็อกอิน (Protected Routes)
  const pathname = request.nextUrl.pathname
  const isProtectedPath =
    pathname.startsWith('/my-recipe') ||
    pathname.startsWith('/favorites') ||
    pathname.startsWith('/create-recipe')

  if (isProtectedPath && !session?.access_token) {
    const loginUrl = new URL('/login', request.url)
    const redirectResponse = NextResponse.redirect(loginUrl)
    redirectResponse.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return redirectResponse
  }

  // 5. ส่งต่อ Request ไปยังจุดหมายปลายทาง
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // ป้องกัน Browser Cache สำหรับหน้าเว็บ เพื่อไม่ให้กดย้อนกลับมาดูข้อมูลเก่าหลัง Logout ได้
  if (!pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - photo/ (public photos)
     */
    '/((?!_next/static|_next/image|favicon.ico|photo|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
