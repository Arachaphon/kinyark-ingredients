import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // 1. ลบ headers ลอกเลียนแบบจากฝั่ง Client เพื่อป้องกันการสวมรอย (Spoofing)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.delete('x-user-id')
  requestHeaders.delete('x-user-role')

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

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
          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  const protectedRoutes = ['/home', '/my-recipe', '/favorites', '/create-recipe', '/recipe']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  const authRoutes = ['/login', '/register', '/forgotpassword', '/resetpassword']
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  const isRootRoute = pathname === '/'

  // 2. Check if any Supabase authentication cookie exists before calling getUser()
  const hasAuthCookie = request.cookies.getAll().some(cookie => cookie.name.startsWith('sb-'))

  let user = null
  if (hasAuthCookie) {
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser()
    user = supabaseUser
  }

  // 3. ส่งข้อมูลผู้ใช้ต่อให้ API Route ทำงานแบบ 0ms ไม่ต้องยืนยันตัวตนซ้ำซ้อน
  if (user) {
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-role', user.role || '')
    supabaseResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // 4. ตรวจเช็คสิทธิ์การเข้าถึงหน้าเว็บปกติ
  if (!isProtectedRoute && !isAuthRoute && !isRootRoute) {
    return supabaseResponse
  }

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    return NextResponse.redirect(url)
  }

  // Redirect root to home if authenticated, else allow access to landing page
  if (isRootRoute) {
    if (user) {
      const url = request.nextUrl.clone()
      url.pathname = '/home'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  return supabaseResponse
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
