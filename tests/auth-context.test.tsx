/** @jest-environment jsdom */
import "@testing-library/jest-dom"
import { render, screen, act } from "@testing-library/react"
import { useEffect } from "react"
import { AuthProvider, useAuth } from "@/context/AuthContext"

const mockGetSession = jest.fn()
const mockOnAuthStateChange = jest.fn()
const mockSignOut = jest.fn()

let onAuthCallback: ((event: string, session: unknown) => void) | null = null
let unsubscribeCallback: jest.Mock

jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: mockSignOut,
    },
  })),
}))

beforeEach(() => {
  jest.clearAllMocks()

  unsubscribeCallback = jest.fn()

  mockGetSession.mockResolvedValue({
    data: { session: null },
    error: null,
  })

  mockOnAuthStateChange.mockImplementation((callback: typeof onAuthCallback) => {
    onAuthCallback = callback
    callback("INITIAL_SESSION", null)
    return { data: { subscription: { unsubscribe: unsubscribeCallback } } }
  })
})

function TestConsumer() {
  const { user, session, status } = useAuth()
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user ? "logged-in" : "no-user"}</span>
      <span data-testid="session">{session ? "has-session" : "no-session"}</span>
    </div>
  )
}

describe("AuthContext — 3 scenarios after fix", () => {
  test("Scenario 1: session persists after page refresh (onAuthStateChange fires with session)", () => {
    const mockSession = {
      user: { id: "user-1", email: "test@example.com" },
      access_token: "token",
    }

    mockOnAuthStateChange.mockImplementation((callback: typeof onAuthCallback) => {
      onAuthCallback = callback
      callback("INITIAL_SESSION", mockSession)
      return { data: { subscription: { unsubscribe: unsubscribeCallback } } }
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    expect(screen.getByTestId("status")).toHaveTextContent("authenticated")
    expect(screen.getByTestId("user")).toHaveTextContent("logged-in")
    expect(screen.getByTestId("session")).toHaveTextContent("has-session")
  })

  test("Scenario 2: logout in one tab updates auth state via onAuthStateChange callback", () => {
    const mockSession = {
      user: { id: "user-1", email: "test@example.com" },
      access_token: "token",
    }

    mockOnAuthStateChange.mockImplementation((callback: typeof onAuthCallback) => {
      onAuthCallback = callback
      callback("INITIAL_SESSION", mockSession)
      return { data: { subscription: { unsubscribe: unsubscribeCallback } } }
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    expect(screen.getByTestId("status")).toHaveTextContent("authenticated")

    act(() => {
      onAuthCallback!("SIGNED_OUT", null)
    })

    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated")
    expect(screen.getByTestId("user")).toHaveTextContent("no-user")
    expect(screen.getByTestId("session")).toHaveTextContent("no-session")
  })

  test("Scenario 3: no race condition — onAuthStateChange fires synchronously before first render completes", () => {
    const mockSession = {
      user: { id: "user-1", email: "test@example.com" },
      access_token: "token",
    }

    let capturedStatus = ""
    function CaptureStatus() {
      const { status } = useAuth()
      useEffect(() => {
        capturedStatus = status
      })
      return <span data-testid="status">{status}</span>
    }

    mockOnAuthStateChange.mockImplementation((callback: typeof onAuthCallback) => {
      onAuthCallback = callback
      callback("INITIAL_SESSION", mockSession)
      return { data: { subscription: { unsubscribe: unsubscribeCallback } } }
    })

    render(
      <AuthProvider>
        <CaptureStatus />
      </AuthProvider>
    )

    expect(capturedStatus).toBe("authenticated")
  })

  test("no session on first load — status is unauthenticated", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated")
    expect(screen.getByTestId("user")).toHaveTextContent("no-user")
    expect(screen.getByTestId("session")).toHaveTextContent("no-session")
  })

  test("unsubscribe on unmount — no memory leak", () => {
    const { unmount } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    expect(unsubscribeCallback).not.toHaveBeenCalled()

    unmount()

    expect(unsubscribeCallback).toHaveBeenCalledTimes(1)
  })

  test("refreshUser is still available via context", () => {
    let refreshUserFn: (() => Promise<void>) | null = null
    function RefreshConsumer() {
      const { refreshUser } = useAuth()
      useEffect(() => {
        refreshUserFn = refreshUser
      })
      return null
    }

    render(
      <AuthProvider>
        <RefreshConsumer />
      </AuthProvider>
    )

    expect(refreshUserFn).toBeDefined()
    expect(typeof refreshUserFn).toBe("function")
  })
})
