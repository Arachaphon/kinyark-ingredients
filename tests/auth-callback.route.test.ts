const mockExchangeCodeForSession = jest.fn();
const mockApplyTo = jest.fn((res) => res);
jest.mock("@/lib/supabase/server", () => ({
  createRouteHandlerClient: jest.fn(() => ({
    supabase: {
      auth: { exchangeCodeForSession: mockExchangeCodeForSession },
    },
    getCookiesToSet: jest.fn(() => []),
    applyTo: mockApplyTo,
  })),
}));

import { GET } from "@/app/auth/callback/route";

function callbackRequest(query: string) {
  return new Request(`http://localhost:3000/auth/callback${query}`);
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
  });

  test("exchanges code and redirects to safe next path", async () => {
    const res = await GET(callbackRequest("?code=abc123&next=/resetpassword"));

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/resetpassword"
    );
  });

  test("falls back to /home when next is missing", async () => {
    const res = await GET(callbackRequest("?code=abc123"));

    expect(res.headers.get("location")).toBe("http://localhost:3000/home");
  });

  test("falls back to /home for external next (open-redirect guard)", async () => {
    const res = await GET(
      callbackRequest("?code=abc123&next=//evil.com/phish")
    );

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(res.headers.get("location")).toBe("http://localhost:3000/home");
  });

  test("redirects expired recovery links back to forgotpassword", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: { message: "code expired" },
    });

    const res = await GET(
      callbackRequest("?code=stale&next=/resetpassword")
    );
    const location = res.headers.get("location") ?? "";

    expect(location.startsWith("http://localhost:3000/forgotpassword?error=")).toBe(true);
  });

  test("redirects login errors to login page", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: { message: "bad code" },
    });

    const res = await GET(callbackRequest("?code=stale"));
    const location = res.headers.get("location") ?? "";

    expect(location.startsWith("http://localhost:3000/login?error=")).toBe(true);
  });

  test("redirects to home when no code is present", async () => {
    const res = await GET(callbackRequest(""));

    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBe("http://localhost:3000/home");
  });

  test("persists supabase cookies on success redirect (session not lost)", async () => {
    await GET(callbackRequest("?code=abc123&next=/resetpassword"));

    expect(mockApplyTo).toHaveBeenCalled();
    const appliedResponse = mockApplyTo.mock.calls[0][0];
    expect(appliedResponse.headers.get("location")).toBe(
      "http://localhost:3000/resetpassword"
    );
  });

  test("persists supabase cookies on error redirect to forgotpassword", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: { message: "code expired" },
    });

    await GET(callbackRequest("?code=stale&next=/resetpassword"));

    expect(mockApplyTo).toHaveBeenCalled();
  });
});
