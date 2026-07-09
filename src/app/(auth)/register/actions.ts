"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { registerSchema } from "@/lib/validations/auth.schema";

export async function signup(
  prevState: { message?: string; success?: boolean },
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;

   console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log("SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "มีค่า ✅" : "ไม่มีค่า ❌")

  // 1. Validate ก่อนทำอะไรทั้งนั้น
  const result = registerSchema.safeParse({ email, password, username });
  if (!result.success) return { message: result.error.issues[0].message, success: false };

  // 2. สมัคร Auth
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { message: error.message, success: false };

  const userId = data.user?.id;
  if (!userId) return { message: "Failed to create user", success: false };

  // 3. ใช้ Admin client insert users (ข้าม RLS ได้)
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: dbError } = await admin
    .from("users") 
    .upsert({ id: userId, email, username });

  console.log("DB Error:", JSON.stringify(dbError))

  if (dbError) return { message: dbError.message, success: false };

  revalidatePath("/", "layout");
  return { success: true };
}