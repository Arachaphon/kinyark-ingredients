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
    expect(screen.getByPlaceholderText("ชื่อผู้ใช้/อีเมล")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("รหัสผ่าน")).toBeInTheDocument()
  })

  test("register page loads", () => {
    render(<RegisterPage />)
    expect(screen.getByPlaceholderText("ชื่อผู้ใช้")).toBeInTheDocument()
  })

  test("login with wrong credentials shows error", async () => {
    mockLogin.mockResolvedValue({ message: "อีเมล/ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" })

    render(<LoginPage />)
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText("ชื่อผู้ใช้/อีเมล"), "wrong@email.com")
    await user.type(screen.getByPlaceholderText("รหัสผ่าน"), "wrongpassword")
    await user.click(screen.getByRole("button", { name: "เข้าสู่ระบบ" }))

    expect(await screen.findByText("อีเมล/ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")).toBeInTheDocument()
  })

  test("navigate from login to register", () => {
    render(<LoginPage />)
    const buttons = screen.getAllByRole("button", { name: "สมัครสมาชิก" })
    expect(buttons.length).toBeGreaterThan(0)
  })
})
