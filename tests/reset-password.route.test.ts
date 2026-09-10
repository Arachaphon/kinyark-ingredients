const mockPrisma = {
  user: {
    findFirst: jest.fn(),
  },
};
jest.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

const mockSupabaseAuth = {
  resetPasswordForEmail: jest.fn(),
};
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: mockSupabaseAuth,
  })),
}));

import { POST } from "@/app/api/reset-password/route";

function postRequest(body: unknown, origin = "http://localhost:3000") {
  return new Request("http://localhost/api/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/reset-password", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({ error: null });
  });

  test("returns 400 for invalid email format", async () => {
    const res = await POST(postRequest({ email: "not-an-email" }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("อีเมล");
    expect(mockSupabaseAuth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  test("returns 400 for missing email", async () => {
    const res = await POST(postRequest({}));
    expect(res.status).toBe(400);
    expect(mockSupabaseAuth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  test("returns 400 for invalid JSON body", async () => {
    const res = await POST(postRequest("not-json{{{"));
    expect(res.status).toBe(400);
  });

  test("returns generic success without revealing unknown email", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);

    const res = await POST(postRequest({ email: "ghost@example.com" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockSupabaseAuth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  test("sends recovery email via callback link for known email", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: "user-1" });

    const res = await POST(postRequest({ email: "User@Example.com" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockSupabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith(
      "user@example.com",
      {
        redirectTo:
          "http://localhost:3000/auth/callback?next=/resetpassword",
      }
    );
  });

  test("finds user case-insensitively (uppercase stored email)", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: "user-1" });

    const res = await POST(postRequest({ email: "Focus@Example.com" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    // input โดน lowercase + lookup แบบ insensitive → เจอแถวที่เก็บตัวใหญ่
    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: { equals: "focus@example.com", mode: "insensitive" } },
      select: { id: true },
    });
    expect(mockSupabaseAuth.resetPasswordForEmail).toHaveBeenCalled();
  });

  test("returns 500 when email sending fails (does not swallow)", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: "user-1" });
    mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({
      error: { status: 500, message: "SMTP down" },
    });

    const res = await POST(postRequest({ email: "user@example.com" }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain("ลองใหม่ภายหลัง");
  });

  test("returns 429 with wait message on rate limit (status)", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: "user-1" });
    mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({
      error: { status: 429, message: "email rate limit exceeded" },
    });

    const res = await POST(postRequest({ email: "user@example.com" }));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toContain("รอ 1 ชั่วโมง");
  });

  test("returns 429 with wait message on rate limit (code only)", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: "user-1" });
    mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({
      error: { code: "over_email_send_rate_limit" },
    });

    const res = await POST(postRequest({ email: "user@example.com" }));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toContain("รอ 1 ชั่วโมง");
  });
});
