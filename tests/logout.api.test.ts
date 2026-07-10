const mockSupabaseAuth = {
  signOut: jest.fn(),
};
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: mockSupabaseAuth,
    })
  ),
}));

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
    mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

    const response = await POST(createLogoutRequest());

    expect(mockSupabaseAuth.signOut).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });

  test("handles logout gracefully when no active session", async () => {
    mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

    const response = await POST(createLogoutRequest());

    expect(mockSupabaseAuth.signOut).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });
});
