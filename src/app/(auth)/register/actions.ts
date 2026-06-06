"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from '@/lib/validations/auth.schema'

export async function signup(prevState: { message?: string }, formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { message: error.message };

  const result = registerSchema.safeParse({ email, password, username });
  if (!result.success) return { message: result.error.issues[0].message };

  const userId = data.user?.id;
  if (!userId) return { message: "Failed to create user" };

  const { error: dbError } = await supabase
    .from("users")
    .upsert({ id: userId, email, username });

  if (dbError) return { message: dbError.message };

  revalidatePath("/", "layout");
  redirect("/login");
}
