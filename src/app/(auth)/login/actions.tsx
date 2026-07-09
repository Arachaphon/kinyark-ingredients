"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth.schema";

export async function login(
  prevState: { message?: string },
  formData: FormData
) {
  const supabase = await createClient();

  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const result = loginSchema.safeParse(raw);
  if (!result.success) {
    return { message: result.error.issues[0].message };
  }

  let email = raw.email;

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.email);
  if (!isEmail) {
    const user = await prisma.user.findUnique({
      where: { username: raw.email },
      select: { email: true },
    });
    if (!user) {
      return { message: "ไม่พบบัญชีผู้ใช้นี้" };
    }
    email = user.email;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: raw.password,
  });

  if (error) {
    return {
      message:
        error.message === "Invalid login credentials"
          ? "อีเมล/ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
          : error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect("/home");
}