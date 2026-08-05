"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth.schema";

export async function signup(
  prevState: { message?: string; success?: boolean },
  formData: FormData
) {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    username: formData.get("username") as string,
    role: formData.get("role") as string || "user",
  };

  const result = registerSchema.safeParse(raw);
  if (!result.success) {
    return { message: result.error.issues[0].message, success: false };
  }

  const { email, password, username, role } = result.data;

  const existingEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingEmail) {
    return { message: "อีเมลนี้ถูกใช้งานแล้ว", success: false };
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (existingUsername) {
    return { message: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว", success: false };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    if (error.message === "User already registered") {
      return { message: "อีเมลนี้ถูกลงทะเบียนแล้ว", success: false };
    }
    return { message: error.message, success: false };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { message: "ไม่สามารถสร้างผู้ใช้ได้ กรุณาลองอีกครั้ง", success: false };
  }

  try {
    await prisma.user.create({
      data: {
        id: userId,
        email,
        username,
        role: role === "store" ? "STORE" : "USER",
      },
    });
  } catch (err) {
    console.error("Prisma create user error:", err);
    return { message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองอีกครั้ง", success: false };
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return { success: true };
}