import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import { logResetEvent } from "@/lib/reset-log";

/** True when a Supabase Auth error is a rate-limit rejection (status/code first, message as fallback). */
function isRateLimitError(error: { status?: number; code?: string; message?: string }): boolean {
  if (error.status === 429) return true;
  if (error.code === "over_email_send_rate_limit") return true;
  return /rate limit/i.test(error.message ?? "");
}

const resetRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email("รูปแบบอีเมลไม่ถูกต้อง"),
});

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบคำขอไม่ถูกต้อง" }, { status: 400 });
    }

    const parsed = resetRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "รูปแบบอีเมลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const { email } = parsed.data;

    // เช็กแบบเงียบ: ไม่เปิดเผยว่าอีเมลมีในระบบหรือไม่ (ป้องกันการเดาบัญชี)
    // ใช้ findFirst + insensitive lookup เป็น safety net กันแถวที่เก็บ email ปน case
    // (เช่นสมัครด้วยตัวใหญ่) — findUnique ของ Prisma รับแค่ exact match จึงใช้ไม่ได้ตรงนี้
    const dbUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });

    if (!dbUser) {
      // ไม่พบ user: ตอบ generic เสมอ (กัน account enumeration) แต่ log ฝั่ง server ไว้
      logResetEvent("reset_skipped_user_not_found", email);
      return NextResponse.json({
        success: true,
        message: "หากอีเมลนี้มีในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปแล้ว",
      });
    }

    // ต้องใช้ Route Handler client ที่ capture cookies — PKCE code verifier ที่
    // resetPasswordForEmail สร้างต้องถูกส่งกลับไปเก็บใน browser ไม่งั้นตอนกดลิงก์
    // ในอีเมล callback จะแลก code ไม่ผ่าน (PKCE code verifier not found)
    // แล้วผู้ใช้จะโดนโยนไป /forgotpassword แทน /resetpassword
    const { supabase, applyTo } = await createRouteHandlerClient();
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // ลิงก์ในอีเมลวิ่งเข้า callback เพื่อแลก code เป็น session ก่อน แล้วค่อยไป /resetpassword
      redirectTo: `${origin}/auth/callback?next=/resetpassword`,
    });

    if (error) {
      if (isRateLimitError(error)) {
        // โดน rate limit: บอก user ตรง ๆ ให้รอ (ไม่กลืนเป็น success หลอก)
        logResetEvent("reset_rate_limited", email);
        return NextResponse.json(
          { error: "ขอมากเกินไป กรุณารอ 1 ชั่วโมงแล้วลองใหม่" },
          { status: 429 }
        );
      }
      // ส่งล้มเหลวจริง (เช่น SMTP พัง): log เต็มฝั่ง server, ตอบ client แบบ generic
      console.error("Supabase Email Error:", error.message);
      logResetEvent("reset_smtp_error", email);
      return NextResponse.json(
        { error: "ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่ภายหลัง" },
        { status: 500 }
      );
    }

    return applyTo(
      NextResponse.json({
        success: true,
        message: "หากอีเมลนี้มีในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปแล้ว",
      })
    );
  } catch (error) {
    console.error("Reset password API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
