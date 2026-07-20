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

function createLogoutRequest(): Request {
  return new Request("http://localhost:3000/api/auth/logout", {
    method: "POST",
  });
}

describe("logout API route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("signs out and redirects to /login on successful logout", async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const response = await POST(createLogoutRequest());

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });

  test("handles logout gracefully when no active session", async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const response = await POST(createLogoutRequest());

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });
});
