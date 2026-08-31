import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return Response.json({ error: "กรุณาระบุอีเมล" }, { status: 400 });
    }

    // 1. ดึง ID จาก Schema (Prisma) เพื่อยืนยันว่ามีผู้ใช้นี้ในระบบจริง
    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (!dbUser) {
      // ถ้าไม่มีใน Schema (ไม่ได้สมัครสมาชิก) จะไม่ส่งอีเมล
      return Response.json({ error: "ไม่พบอีเมลนี้ในระบบ" }, { status: 404 });
    }

    // 2. ถ้ามีผู้ใช้จริง สั่งให้ Supabase ส่งอีเมลแจ้งรีเซ็ตรหัสผ่าน
    const supabase = await createClient();
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/resetpassword`, // ลิงก์ที่เด้งกลับหลังกดอีเมล
    });

    if (error) {
      console.error("Supabase Email Error:", error.message);
      return Response.json({ error: "ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่ภายหลัง" }, { status: 400 });
    }

    return Response.json({ success: true, message: "ส่งอีเมลสำเร็จ" });
  } catch (error) {
    console.error("Reset password API error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}