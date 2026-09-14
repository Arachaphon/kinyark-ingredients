import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { verifySupabaseJWT } from './lib/auth-jwt'

export async function proxy(request: NextRequest) {
  // 1. ลบ headers ลอกเลียนแบบจากฝั่ง Client เพื่อป้องกันการสวมรอย (Spoofing)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.delete('x-user-id')
  requestHeaders.delete('x-user-role')

  // 1b. ทางลัด request นิรนาม: ถ้าไม่มี auth cookie ของ Supabase เลย
  // session ต้องเป็น null อยู่แล้ว ข้าม createServerClient + getSession ไปได้
  // แล้วไหลลง logic ด้านล่างด้วย session=null เพื่อคงพฤติกรรมเดิม
  // (protected redirect + Cache-Control) ไว้ทุกประการ
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"))

  let session: { access_token?: string } | null = null
  // สร้าง response ตั้งแต่ต้นเพื่อให้ setAll แปะ cookie ลง response ได้
  // (pattern มาตรฐาน @supabase/ssr — ถ้าเขียนแค่ request.cookies session/refresh จะหาย)
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  if (hasAuthCookie) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // 2. ดึง session จากคุกกี้ท้องถิ่นเท่านั้น (0ms Network latency)
    const { data } = await supabase.auth.getSession()
    session = data.session
  }

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
    // คง Supabase cookies ที่ refresh ระหว่างทางไว้บน redirect ด้วย
    response.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value, c as Parameters<typeof redirectResponse.cookies.set>[2])
    })
    return redirectResponse
  }

  // 5. ส่งต่อ Request ไปยังจุดหมายปลายทาง
  // NOTE: ต้องสร้าง response ใหม่พร้อม headers กัน spoofing แล้ว copy Supabase
  // cookies ที่ refresh ระหว่างทางกลับมา (NextResponse.next ใหม่จะทิ้ง cookies เดิม)
  const finalResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  response.cookies.getAll().forEach((c) => {
    finalResponse.cookies.set(c.name, c.value, c as Parameters<typeof finalResponse.cookies.set>[2])
  })

  // ป้องกัน Browser Cache สำหรับหน้าเว็บ เพื่อไม่ให้กดย้อนกลับมาดูข้อมูลเก่าหลัง Logout ได้
  if (!pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
    finalResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  }

  return finalResponse
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
