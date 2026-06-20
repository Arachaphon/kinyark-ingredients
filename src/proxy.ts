import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const publicRoutes = ["/login", "/register"];

  // 🌟 1. เช็คว่าเส้นทางที่เรียกมา เป็นท่อ API สำหรับดึงข้อมูลหรือไม่ (เช่น /api/posts/recommended)
  // เพื่อเปิดโอกาสให้หน้าแรกดึงข้อมูลไปโชว์ได้ แม้ผู้ใช้จะยังไม่ได้ Sign इन เข้าสู่ระบบครับ
  const isApiRoute =
  request.nextUrl.pathname.startsWith(
    "/api/recipes/recommended"
  );

  const isPublic =
    request.nextUrl.pathname === "/" ||
    isApiRoute || // 🟢 ปล่อยผ่านให้ท่อ API นี้เป็นสาธารณะ
    publicRoutes.some((r) => request.nextUrl.pathname.startsWith(r));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};