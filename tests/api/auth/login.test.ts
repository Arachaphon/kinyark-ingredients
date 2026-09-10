/**
 * QA: Login Integration Tests
 * Tests the login server action's decision logic with mocked dependencies.
 */

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
  if (overrides.email !== undefined) fd.set("email", overrides.email);
  if (overrides.password !== undefined) fd.set("password", overrides.password);
  return fd;
}

describe("login server action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("failed login: missing fields", async () => {
    const fd = createFormData({ email: "" }); // Missing password, empty email
    const result = await login({ message: "" }, fd);
    expect(result).toHaveProperty("message");
  });

  test("failed login: no such user (username lookup fails)", async () => {
    const fd = createFormData({ email: "nonexistent", password: "Password1!" });
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await login({ message: "" }, fd);
    expect(result).toEqual({ message: "ไม่พบบัญชีผู้ใช้นี้" });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { username: "nonexistent" },
      select: { email: true },
    });
  });

  test("failed login: bad credentials", async () => {
    const fd = createFormData({ email: "test@example.com", password: "WrongPassword1!" });
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    const result = await login({ message: "" }, fd);
    expect(result).toEqual({ message: "อีเมล/ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "WrongPassword1!",
    });
  });

  test("successful login (with email)", async () => {
    const fd = createFormData({ email: "test@example.com", password: "CorrectPassword1!" });
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "user-id" }, session: {} },
      error: null,
    });

    await login({ message: "" }, fd);
    
    expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "CorrectPassword1!",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(redirect).toHaveBeenCalledWith("/home");
  });

  test("successful login (with username)", async () => {
    const fd = createFormData({ email: "validuser", password: "CorrectPassword1!" });
    mockPrisma.user.findUnique.mockResolvedValue({ email: "user@example.com" });
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "user-id" }, session: {} },
      error: null,
    });

    await login({ message: "" }, fd);
    
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { username: "validuser" },
      select: { email: true },
    });
    expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "CorrectPassword1!",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(redirect).toHaveBeenCalledWith("/home");
  });
});
