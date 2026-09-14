import { NextResponse } from "next/server";
import { applySupabaseCookies } from "@/lib/supabase/server";

describe("applySupabaseCookies", () => {
  test("sets PKCE verifier cookie on the response (Set-Cookie emitted)", () => {
    const res = NextResponse.json({ success: true });

    applySupabaseCookies(res, [
      {
        name: "sb-ref-auth-token-code-verifier",
        value: "verifier123/PASSWORD_RECOVERY",
        options: { path: "/" },
      },
    ]);

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("sb-ref-auth-token-code-verifier=verifier123");
  });

  test("no-op when there is nothing to persist", () => {
    const res = NextResponse.json({ success: true });

    expect(() => applySupabaseCookies(res, [])).not.toThrow();
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});
