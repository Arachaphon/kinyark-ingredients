import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/auth/me/route'
import { AUTH_PROFILE_SELECT } from '@/lib/profile'

// ประกาศ mock variables
const mockGetUser = jest.fn()
const mockFindUnique = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
  })),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}))

jest.mock('@/lib/profile', () => {
  const actualProfile = jest.requireActual('@/lib/profile')
  return {
    ...actualProfile,
    getProfile: jest.fn().mockImplementation(async (select) => {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.getUser()

      if (error || !data?.user) {
        return { user: null, error: 'Unauthorized', status: 401 }
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: data.user.id },
        select,
      })

      if (!dbUser) {
        return { user: null, error: 'Not found', status: 404 }
      }

      return { user: dbUser, error: null, status: 200 }
    }),
  }
})

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  username: 'testuser',
  email: 'testuser@example.com',
  avatarUrl: null,
}

const mockSupabaseUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'testuser@example.com',
}

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns 200 with user profile when authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockFindUnique.mockResolvedValue(mockUser)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.user).toEqual(mockUser)
  })

  test('does not leak password or sensitive fields', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockFindUnique.mockResolvedValue(mockUser)

    const res = await GET()
    const body = await res.json()

    expect(body.user.password).toBeUndefined()
    const sensitiveKeys = Object.keys(body.user).filter((k) =>
      /password|hash|token|secret/i.test(k)
    )
    expect(sensitiveKeys).toHaveLength(0)
  })

  test('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  test('returns 401 when getUser returns an error but no user', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Token expired'),
    })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  test('returns 404 when DB record is missing', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockFindUnique.mockResolvedValue(null)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Not found')
  })

  test('returns 500 on internal server error', async () => {
    mockGetUser.mockRejectedValue(new Error('Network error'))

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Internal Server Error')
  })

  test('passes AUTH_PROFILE_SELECT through to Prisma', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockFindUnique.mockResolvedValue(mockUser)

    await GET()

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: mockSupabaseUser.id },
      select: AUTH_PROFILE_SELECT,
    })
  })
})