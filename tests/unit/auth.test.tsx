/** @jest-environment jsdom */
import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import LoginPage from "@/app/(auth)/login/page"
import RegisterPage from "@/app/(auth)/register/page"

jest.mock("next/font/google", () => ({
  Anuphan: () => ({
    style: {
      fontFamily: "mocked",
    },
  }),
}))

const mockLogin = jest.fn()

jest.mock("@/app/(auth)/login/actions", () => ({
  login: (...args: unknown[]) => mockLogin(...args),
}))

jest.mock("@/app/(auth)/register/actions", () => ({
  signup: jest.fn(),
}))

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

beforeEach(() => {
  mockLogin.mockReset()
  mockLogin.mockResolvedValue({ message: "" })
})

describe("Authentication", () => {
  test("login page loads", () => {
    render(<LoginPage />)
    expect(screen.getByTestId("login-email-input")).toBeInTheDocument()
    expect(screen.getByTestId("login-password-input")).toBeInTheDocument()
    expect(screen.getByTestId("login-submit-button")).toBeInTheDocument()
  })

  test("register page loads", () => {
    render(<RegisterPage />)
    expect(screen.getByTestId("register-username-input")).toBeInTheDocument()
    expect(screen.getByTestId("register-email-input")).toBeInTheDocument()
    expect(screen.getByTestId("register-password-input")).toBeInTheDocument()
  })

  test("login with wrong credentials shows error", async () => {
    mockLogin.mockResolvedValue({ message: "อีเมล/ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" })

    render(<LoginPage />)
    const user = userEvent.setup()

    await user.type(screen.getByTestId("login-email-input"), "wrong@email.com")
    await user.type(screen.getByTestId("login-password-input"), "wrongpassword")
    await user.click(screen.getByTestId("login-submit-button"))

    expect(await screen.findByTestId("login-error-message")).toHaveTextContent("อีเมล/ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
  })

  test("navigate from login to register", () => {
    render(<LoginPage />)
    const buttons = screen.getAllByRole("button", { name: "สมัครสมาชิก" })
    expect(buttons.length).toBeGreaterThan(0)
  })

  test("register with password mismatch shows client error", async () => {
    render(<RegisterPage />)
    const user = userEvent.setup()

    await user.type(screen.getByTestId("register-username-input"), "newuser")
    await user.type(screen.getByTestId("register-email-input"), "new@test.com")
    await user.type(screen.getByTestId("register-password-input"), "StrongPassword1!")
    await user.type(screen.getByTestId("register-confirm-password-input"), "DifferentPassword1!")
    
    // Select role
    await user.selectOptions(screen.getByTestId("register-role-select"), "user")

    await user.click(screen.getByTestId("register-submit-button"))

    expect(await screen.findByTestId("register-error-message")).toHaveTextContent("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน")
  })

  test("register with weak password shows client error", async () => {
    render(<RegisterPage />)
    const user = userEvent.setup()

    await user.type(screen.getByTestId("register-username-input"), "newuser")
    await user.type(screen.getByTestId("register-email-input"), "new@test.com")
    await user.type(screen.getByTestId("register-password-input"), "weak")
    await user.type(screen.getByTestId("register-confirm-password-input"), "weak")
    
    await user.selectOptions(screen.getByTestId("register-role-select"), "user")

    await user.click(screen.getByTestId("register-submit-button"))

    expect(await screen.findByTestId("register-error-message")).toHaveTextContent("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร")
  })
})
