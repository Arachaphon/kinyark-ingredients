import { prisma } from "@/lib/prisma";

const SYSTEM_USER_EMAIL = "ai-system@kinyark.local";

/**
 * คืน userId ของบัญชีระบบที่ใช้สร้างเมนูจาก AI
 * - ใช้ระบบ upsert ด้วย email ที่ตายตัว → รับรองว่า row มีอยู่จริงเสมอ (กัน FK violation หลัง DB ถูกรีเซ็ต)
 * - ไม่ cache หน้า process → ไม่ค้างค่าเก่าที่ชี้ไปหา user ที่ถูกลบไปแล้ว
 */
export async function getSystemUserId(): Promise<string> {
  const created = await prisma.user.upsert({
    where: { email: SYSTEM_USER_EMAIL },
    update: {},
    create: {
      email: SYSTEM_USER_EMAIL,
      username: "KINYARK AI",
      role: "ADMIN",
    },
    select: { id: true },
  });
  return created.id;
}