"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth.schema";

export async function login(
  prevState: { message?: string },
  formData: FormData
) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const result = loginSchema.safeParse(data);
  if (!result.success) {
    return { message: result.error.issues[0].message };
  }

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return {
      message:
        error.message === "Invalid login credentials"
          ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
          : error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect("/home");
}