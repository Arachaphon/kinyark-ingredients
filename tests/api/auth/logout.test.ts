/**
 * QA: Logout Integration Tests
 * Tests the logout API route.
 */

const mockSignOut = jest.fn()

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      signOut: mockSignOut,
    },
  })),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    getAll: jest.fn(() => []),
  })),
}))

import { POST } from "@/app/api/auth/logout/route";

describe("logout api route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("successful logout (with active session)", async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const request = new Request("http://localhost/api/auth/logout", {
      method: "POST",
    });

    const response = await POST(request);

    expect(mockSignOut).toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("http://localhost/login");
  });

  test("logout with no active session", async () => {
    // Supabase signOut still resolves if there's no active session
    mockSignOut.mockResolvedValue({ error: null });

    const request = new Request("http://localhost/api/auth/logout", {
      method: "POST",
    });

    const response = await POST(request);

    expect(mockSignOut).toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("http://localhost/login");
  });
});
