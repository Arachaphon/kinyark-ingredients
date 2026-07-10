/**
 * QA: Logout Integration Tests
 * Tests the logout API route.
 */

const mockSupabaseAuth = {
  signOut: jest.fn(),
};

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: mockSupabaseAuth,
  })),
}));

import { POST } from "@/app/api/auth/logout/route";

describe("logout api route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("successful logout (with active session)", async () => {
    mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

    const request = new Request("http://localhost/api/auth/logout", {
      method: "POST",
    });

    const response = await POST(request);

    expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("http://localhost/login");
  });

  test("logout with no active session", async () => {
    // Supabase signOut still resolves if there's no active session
    mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

    const request = new Request("http://localhost/api/auth/logout", {
      method: "POST",
    });

    const response = await POST(request);

    expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("http://localhost/login");
  });
});
