import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import LoginPage from "@/app/(auth)/login/page"
import RegisterPage from "@/app/(auth)/register/page"

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
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument()
  })

  test("register page loads", () => {
    render(<RegisterPage />)
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument()
  })

  test("login with wrong credentials shows error", async () => {
    mockLogin.mockResolvedValue({ message: "Invalid credentials" })

    render(<LoginPage />)
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText("Email"), "wrong@email.com")
    await user.type(screen.getByPlaceholderText("Password"), "wrongpassword")
    await user.click(screen.getByRole("button", { name: "Login" }))

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument()
  })

  test("navigate from login to register", () => {
    render(<LoginPage />)
    const link = screen.getByRole("link", { name: "Register" })
    expect(link).toHaveAttribute("href", "/register")
  })
})
