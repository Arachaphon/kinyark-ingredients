jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
};
jest.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

const mockSupabaseAuth = {
  signInWithPassword: jest.fn(),
};
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: mockSupabaseAuth,
  })),
}));

import { login } from "@/app/(auth)/login/actions";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function createFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("email", overrides.email ?? "test@example.com");
  fd.set("password", overrides.password ?? "StrongP@ss1");
  return fd;
}

describe("login server action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns validation error for empty email", async () => {
    const fd = createFormData({ email: "" });
    const result = await login({ message: "" }, fd);
    expect(result.message).toBeTruthy();
  });

  test("returns validation error for empty password", async () => {
    const fd = createFormData({ password: "" });
    const result = await login({ message: "" }, fd);
    expect(result.message).toBeTruthy();
  });

  test("returns error when username is not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const fd = createFormData({ email: "nonexistentuser" });
    const result = await login({ message: "" }, fd);
    expect(result.message).toBe("ไม่พบบัญชีผู้ใช้นี้");
  });

  test("returns translated error on invalid credentials", async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

    const fd = createFormData({ email: "wrong@example.com" });
    const result = await login({ message: "" }, fd);
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(result.message).toBe("อีเมล/ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  });

  test("returns raw error message on unexpected Supabase error", async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Rate limit exceeded" },
    });

    const fd = createFormData();
    const result = await login({ message: "" }, fd);
    expect(result.message).toBe("Rate limit exceeded");
  });

  test("redirects to /home on successful login with email", async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "user-id" } },
      error: null,
    });

    const fd = createFormData();
    await login({ message: "" }, fd);

    expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "StrongP@ss1",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(redirect).toHaveBeenCalledWith("/home");
  });

  test("redirects to /home on successful login with username", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ email: "resolved@example.com" });
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "user-id" } },
      error: null,
    });

    const fd = createFormData({ email: "someusername" });
    await login({ message: "" }, fd);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { username: "someusername" },
      select: { email: true },
    });
    expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
      email: "resolved@example.com",
      password: "StrongP@ss1",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(redirect).toHaveBeenCalledWith("/home");
  });
});
