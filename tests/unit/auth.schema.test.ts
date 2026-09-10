import { registerSchema, loginSchema } from "@/lib/validations/auth.schema";

describe("auth.schema.ts", () => {
  describe("registerSchema", () => {
    const validBase = {
      username: "testuser",
      email: "test@example.com",
      password: "StrongPassword1!",
      role: "user" as const,
    };

    test("valid registration data", () => {
      const result = registerSchema.safeParse(validBase);
      expect(result.success).toBe(true);
    });

    test("rejects invalid email format", () => {
      const result = registerSchema.safeParse({
        ...validBase,
        email: "invalid-email",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("รูปแบบอีเมลไม่ถูกต้อง");
      }
    });

    test("rejects short password", () => {
      const result = registerSchema.safeParse({
        ...validBase,
        password: "Short1!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
      }
    });

    test("rejects password without uppercase", () => {
      const result = registerSchema.safeParse({
        ...validBase,
        password: "strongpassword1!",
      });
      expect(result.success).toBe(false);
    });

    test("rejects password without lowercase", () => {
      const result = registerSchema.safeParse({
        ...validBase,
        password: "STRONGPASSWORD1!",
      });
      expect(result.success).toBe(false);
    });

    test("rejects password without number", () => {
      const result = registerSchema.safeParse({
        ...validBase,
        password: "StrongPassword!",
      });
      expect(result.success).toBe(false);
    });

    test("rejects password without special character", () => {
      const result = registerSchema.safeParse({
        ...validBase,
        password: "StrongPassword123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    test("valid login data", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    test("rejects empty email", () => {
      const result = loginSchema.safeParse({
        email: "",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    test("rejects empty password", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });
});
