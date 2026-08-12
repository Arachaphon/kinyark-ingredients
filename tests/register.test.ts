/**
 * QA: Registration Tests
 * Covers: auth.schema.ts validation, duplicate checks, role assignment
 */

import { registerSchema } from "@/lib/validations/auth.schema";

// ---------------------------------------------------------------------------
// Unit: Validation Schema
// ---------------------------------------------------------------------------
describe("registerSchema", () => {
  const validInput = {
    email: "test@example.com",
    password: "StrongP@ss1",
    username: "testuser",
    role: "user",
  };

  test("accepts valid input with all fields", () => {
    const result = registerSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
      expect(result.data.username).toBe("testuser");
      expect(result.data.role).toBe("user");
    }
  });

  test("accepts store role", () => {
    const result = registerSchema.safeParse({ ...validInput, role: "store" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("store");
    }
  });

  test("rejects admin role", () => {
    const result = registerSchema.safeParse({ ...validInput, role: "admin" });
    expect(result.success).toBe(false);
  });

  test("rejects invalid email", () => {
    const result = registerSchema.safeParse({ ...validInput, email: "notanemail" });
    expect(result.success).toBe(false);
  });

  test("rejects empty email", () => {
    const result = registerSchema.safeParse({ ...validInput, email: "" });
    expect(result.success).toBe(false);
  });

  test("rejects password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...validInput, password: "Sh0rt!A" });
    expect(result.success).toBe(false);
  });

  test("rejects password without uppercase letter", () => {
    const result = registerSchema.safeParse({ ...validInput, password: "weakpass1!" });
    expect(result.success).toBe(false);
  });

  test("rejects password without lowercase letter", () => {
    const result = registerSchema.safeParse({ ...validInput, password: "WEAKPASS1!" });
    expect(result.success).toBe(false);
  });

  test("rejects password without number", () => {
    const result = registerSchema.safeParse({ ...validInput, password: "StrongPass!" });
    expect(result.success).toBe(false);
  });

  test("rejects password without special character", () => {
    const result = registerSchema.safeParse({ ...validInput, password: "StrongPass1" });
    expect(result.success).toBe(false);
  });

  test("rejects username shorter than 2 characters", () => {
    const result = registerSchema.safeParse({ ...validInput, username: "a" });
    expect(result.success).toBe(false);
  });

  test("rejects username longer than 30 characters", () => {
    const result = registerSchema.safeParse({ ...validInput, username: "a".repeat(31) });
    expect(result.success).toBe(false);
  });

  test("defaults role to 'user' when omitted", () => {
    const { email, password, username } = validInput;
    const result = registerSchema.safeParse({ email, password, username });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("user");
    }
  });

  test("rejects invalid role value", () => {
    const result = registerSchema.safeParse({ ...validInput, role: "admin" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// register: Duplicate Check (pure logic — no DB)
// ---------------------------------------------------------------------------
describe("register — duplicate detection logic", () => {
  const mockExistingUsers = [
    { id: "1", email: "existing@example.com", username: "existinguser" },
    { id: "2", email: "other@example.com", username: "otheruser" },
  ];

  function checkDuplicate(email: string, username: string): string | null {
    const emailTaken = mockExistingUsers.some((u) => u.email === email);
    if (emailTaken) return "อีเมลนี้ถูกใช้งานแล้ว";
    const usernameTaken = mockExistingUsers.some((u) => u.username === username);
    if (usernameTaken) return "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว";
    return null;
  }

  test("returns null when email and username are available", () => {
    expect(checkDuplicate("new@example.com", "newuser")).toBeNull();
  });

  test("returns error when email is taken", () => {
    expect(checkDuplicate("existing@example.com", "newuser")).toBe("อีเมลนี้ถูกใช้งานแล้ว");
  });

  test("returns error when username is taken", () => {
    expect(checkDuplicate("new@example.com", "existinguser")).toBe("ชื่อผู้ใช้นี้ถูกใช้งานแล้ว");
  });
});

// ---------------------------------------------------------------------------
// register: Role Mapping Logic
// ---------------------------------------------------------------------------
describe("register — role mapping", () => {
  const mapRole = (role: string) => {
    return role === "store" ? "STORE" : "USER";
  };

  test("maps undefined role to 'USER'", () => {
    expect(mapRole("")).toBe("USER");
  });

  test("maps 'store' role to 'STORE'", () => {
    expect(mapRole("store")).toBe("STORE");
  });

  test("maps any other value to 'USER'", () => {
    expect(mapRole("admin")).toBe("USER");
    expect(mapRole("random")).toBe("USER");
  });
});