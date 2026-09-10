/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPasswordPage from "@/app/(auth)/forgotpassword/page";
import ResetPasswordPage from "@/app/(auth)/resetpassword/page";
import CheckEmailPage from "@/app/(auth)/check-email/page";

jest.mock("next/font/google", () => ({
  Anuphan: () => ({ className: "mock-font" }),
}));

const mockPush = jest.fn();
let mockSearchEmail: string | null = "user@example.com";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: (key: string) => (key === "email" ? mockSearchEmail : null) }),
}));

const mockSupabaseAuth = {
  signOut: jest.fn(),
  getSession: jest.fn(),
  updateUser: jest.fn(),
};
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: mockSupabaseAuth }),
}));

const STRONG_PASSWORD = "StrongP@ss1";

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchEmail = "user@example.com";
  mockSupabaseAuth.signOut.mockResolvedValue({ error: null });
  mockSupabaseAuth.getSession.mockResolvedValue({ data: { session: null } });
  mockSupabaseAuth.updateUser.mockResolvedValue({ data: {}, error: null });
  global.fetch = jest.fn();
  localStorage.clear();
});

describe("ForgotPasswordPage", () => {
  test("renders email input and submit button", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByTestId("forgot-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("forgot-submit-button")).toBeInTheDocument();
  });

  test("blank email shows client error without calling API", async () => {
    render(<ForgotPasswordPage />);
    const user = userEvent.setup();

    // ช่องว่างล้วนผ่าน native required แต่ต้องโดน trim-check ของเรา
    await user.type(screen.getByTestId("forgot-email-input"), "   ");
    await user.click(screen.getByTestId("forgot-submit-button"));

    expect(await screen.findByTestId("forgot-error-message")).toHaveTextContent(
      "กรุณากรอกอีเมล"
    );
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("valid email calls API then navigates to check-email", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    render(<ForgotPasswordPage />);
    const user = userEvent.setup();

    await user.type(screen.getByTestId("forgot-email-input"), "user@example.com");
    await user.click(screen.getByTestId("forgot-submit-button"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/reset-password",
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(mockPush).toHaveBeenCalledWith(
      "/check-email?email=user%40example.com"
    );
  });

  test("API failure shows server error without navigating", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Internal Server Error" }),
    });
    render(<ForgotPasswordPage />);
    const user = userEvent.setup();

    await user.type(screen.getByTestId("forgot-email-input"), "user@example.com");
    await user.click(screen.getByTestId("forgot-submit-button"));

    expect(await screen.findByTestId("forgot-error-message")).toHaveTextContent(
      "Internal Server Error"
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("rate-limited response shows wait message without navigating", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: "ขอมากเกินไป กรุณารอ 1 ชั่วโมงแล้วลองใหม่" }),
    });
    render(<ForgotPasswordPage />);
    const user = userEvent.setup();

    await user.type(screen.getByTestId("forgot-email-input"), "user@example.com");
    await user.click(screen.getByTestId("forgot-submit-button"));

    expect(await screen.findByTestId("forgot-error-message")).toHaveTextContent(
      "รอ 1 ชั่วโมง"
    );
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("ResetPasswordPage", () => {
  test("password mismatch shows client error", async () => {
    render(<ResetPasswordPage />);
    const user = userEvent.setup();

    await user.type(screen.getByTestId("reset-password-input"), STRONG_PASSWORD);
    await user.type(screen.getByTestId("reset-confirm-input"), "DifferentP@ss2");
    await user.click(screen.getByTestId("reset-submit-button"));

    expect(await screen.findByTestId("reset-error-message")).toHaveTextContent(
      "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน"
    );
    expect(mockSupabaseAuth.updateUser).not.toHaveBeenCalled();
  });

  test("weak password shows policy error", async () => {
    render(<ResetPasswordPage />);
    const user = userEvent.setup();

    await user.type(screen.getByTestId("reset-password-input"), "weak");
    await user.type(screen.getByTestId("reset-confirm-input"), "weak");
    await user.click(screen.getByTestId("reset-submit-button"));

    expect(await screen.findByTestId("reset-error-message")).toHaveTextContent(
      "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร"
    );
    expect(mockSupabaseAuth.updateUser).not.toHaveBeenCalled();
  });

  test("valid password with recovery session updates and shows success", async () => {
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { session: { access_token: "recovery-token" } },
    });
    render(<ResetPasswordPage />);
    const user = userEvent.setup();

    await user.type(screen.getByTestId("reset-password-input"), STRONG_PASSWORD);
    await user.type(screen.getByTestId("reset-confirm-input"), STRONG_PASSWORD);
    await user.click(screen.getByTestId("reset-submit-button"));

    await waitFor(() => {
      expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
        password: STRONG_PASSWORD,
      });
    });
    expect(await screen.findByText("ตั้งรหัสผ่านใหม่สำเร็จแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่")).toBeInTheDocument();
    expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
  });

  test("missing session shows link-invalid error without updating", async () => {
    mockSupabaseAuth.getSession.mockResolvedValue({ data: { session: null } });
    render(<ResetPasswordPage />);
    const user = userEvent.setup();

    await user.type(screen.getByTestId("reset-password-input"), STRONG_PASSWORD);
    await user.type(screen.getByTestId("reset-confirm-input"), STRONG_PASSWORD);
    await user.click(screen.getByTestId("reset-submit-button"));

    expect(await screen.findByTestId("reset-error-message")).toHaveTextContent(
      "ลิงก์รีเซ็ตรหัสผ่านหมดอายุหรือไม่ถูกต้อง"
    );
    expect(mockSupabaseAuth.updateUser).not.toHaveBeenCalled();
  });
});

describe("CheckEmailPage resend", () => {
  test("resend calls API then starts cooldown blocking repeat clicks", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });
    render(<CheckEmailPage />);
    const user = userEvent.setup();
    const button = screen.getByTestId("checkemail-resend-button");

    expect(button).toBeEnabled();
    await user.click(button);

    expect(await screen.findByTestId("checkemail-resend-message")).toHaveTextContent(
      "เรียบร้อย"
    );
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/reset-password",
        expect.objectContaining({ method: "POST" })
      );
    });

    // กดซ้ำทันทีต้องโดน cooldown บล็อก ไม่ยิง fetch เพิ่ม
    await user.click(button);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/ส่งอีกครั้งใน \d+s/);
  });

  test("preseeded cooldown disables button without fetch", async () => {
    localStorage.setItem(
      "reset-cooldown:user@example.com",
      String(Date.now() + 60000)
    );
    render(<CheckEmailPage />);
    const user = userEvent.setup();
    const button = screen.getByTestId("checkemail-resend-button");

    expect(button).toBeDisabled();
    await user.click(button);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("rate-limited resend shows wait message", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: "ขอมากเกินไป กรุณารอ 1 ชั่วโมงแล้วลองใหม่" }),
    });
    render(<CheckEmailPage />);
    const user = userEvent.setup();

    await user.click(screen.getByTestId("checkemail-resend-button"));

    expect(await screen.findByTestId("checkemail-resend-message")).toHaveTextContent(
      "รอ 1 ชั่วโมง"
    );
  });
});
