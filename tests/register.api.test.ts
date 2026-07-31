/**
 * QA: Registration Integration Tests
 * Tests the signup server action's decision logic with mocked dependencies.
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
    create: jest.fn(),
  },
};
jest.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

const mockSupabaseAuth = {
  signUp: jest.fn(),
  signOut: jest.fn(),
};
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: mockSupabaseAuth,
  })),
}));

import { signup } from "@/app/(auth)/register/actions";

function createFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("email", overrides.email ?? "new@example.com");
  fd.set("password", overrides.password ?? "StrongP@ss1");
  fd.set("username", overrides.username ?? "newuser");
  fd.set("role", overrides.role ?? "user");
  return fd;
}

describe("signup server action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns validation error for missing email", async () => {
    const fd = createFormData({ email: "" });
    const result = await signup({ message: "" }, fd);
    expect(result.success).toBe(false);
    expect(result.message).toBeTruthy();
  });

  test("returns validation error for weak password", async () => {
    const fd = createFormData({ password: "weak" });
    const result = await signup({ message: "" }, fd);
    expect(result.success).toBe(false);
    expect(result.message).toBeTruthy();
  });

  test("returns duplicate email error when email exists", async () => {
    mockPrisma.user.findUnique.mockImplementation(
      ({ where }: { where: { email?: string; username?: string } }) => {
        if (where.email === "new@example.com") return { id: "existing-id" };
        return null;
      }
    );

    const fd = createFormData();
    const result = await signup({ message: "" }, fd);
    expect(result.success).toBe(false);
    expect(result.message).toContain("อีเมล");
  });

  test("returns duplicate username error when username exists", async () => {
    mockPrisma.user.findUnique.mockImplementation(
      ({ where }: { where: { email?: string; username?: string } }) => {
        if (where.username === "newuser") return { id: "existing-id" };
        return null;
      }
    );

    const fd = createFormData();
    const result = await signup({ message: "" }, fd);
    expect(result.success).toBe(false);
    expect(result.message).toContain("ชื่อผู้ใช้");
  });

  test("returns success when registration is valid", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockSupabaseAuth.signUp.mockResolvedValue({
      data: { user: { id: "new-uuid" } },
      error: null,
    });
    mockPrisma.user.create.mockResolvedValue({ id: "new-uuid" });

    const fd = createFormData();
    const result = await signup({ message: "" }, fd);
    expect(result.success).toBe(true);
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        id: "new-uuid",
        email: "new@example.com",
        username: "newuser",
        role: "USER",
      },
    });
  });

  test("creates user with SHOP role when role is shop", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockSupabaseAuth.signUp.mockResolvedValue({
      data: { user: { id: "new-uuid" } },
      error: null,
    });
    mockPrisma.user.create.mockResolvedValue({ id: "new-uuid" });

    const fd = createFormData({ role: "shop" });
    const result = await signup({ message: "" }, fd);
    expect(result.success).toBe(true);
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "SHOP" }),
      })
    );
  });

  test("handles Supabase signup failure", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockSupabaseAuth.signUp.mockResolvedValue({
      data: { user: null },
      error: { message: "User already registered" },
    });

    const fd = createFormData();
    const result = await signup({ message: "" }, fd);
    expect(result.success).toBe(false);
    expect(result.message).toBeTruthy();
  });

  test("handles Prisma create failure after Supabase signup", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockSupabaseAuth.signUp.mockResolvedValue({
      data: { user: { id: "new-uuid" } },
      error: null,
    });
    mockPrisma.user.create.mockRejectedValue(new Error("DB error"));

    const fd = createFormData();
    const result = await signup({ message: "" }, fd);
    expect(result.success).toBe(false);
    expect(result.message).toBeTruthy();
  });
});