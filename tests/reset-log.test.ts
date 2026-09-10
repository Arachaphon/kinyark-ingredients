import { maskEmail, logResetEvent } from "@/lib/reset-log";

describe("maskEmail", () => {
  test("shows first char and domain only, lowercased", () => {
    expect(maskEmail("Test@Example.com")).toBe("t***@example.com");
  });

  test("handles single-char local part", () => {
    expect(maskEmail("a@b.co")).toBe("a***@b.co");
  });

  test("returns stars for malformed input without @", () => {
    expect(maskEmail("no-at-sign")).toBe("***");
  });
});

describe("logResetEvent", () => {
  test("logs prefix, ISO timestamp, event and masked email", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    try {
      logResetEvent("reset_rate_limited", "User@Example.com");

      expect(spy).toHaveBeenCalledTimes(1);
      const line = String(spy.mock.calls[0][0]);
      expect(line).toMatch(
        /^\[reset-password\] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z reset_rate_limited u\*\*\*@example\.com$/
      );
      // full email must never appear in logs
      expect(line).not.toContain("User@Example.com");
    } finally {
      spy.mockRestore();
    }
  });
});
