const mockSupabaseAuth = { getUser: jest.fn() }
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({ auth: mockSupabaseAuth })),
}))

const mockPrisma = { user: { findUnique: jest.fn() } }
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { GET } from '@/app/api/users/me/route'
import { FULL_PROFILE_SELECT } from '@/lib/profile'

const mockProfile = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  username: 'testuser',
  email: 'testuser@example.com',
  avatarUrl: null,
  role: 'USER',
  createdAt: '2025-01-15T08:30:00.000Z',
}

const mockSupabaseUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'testuser@example.com',
}

describe('GET /api/users/me', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns 200 with full profile when authenticated', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockPrisma.user.findUnique.mockResolvedValue(mockProfile)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.user).toEqual(mockProfile)
  })

  test('does not leak password or sensitive fields', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockPrisma.user.findUnique.mockResolvedValue(mockProfile)

    const res = await GET()
    const body = await res.json()

    expect(body.user.password).toBeUndefined()
    const sensitiveKeys = Object.keys(body.user).filter((k) =>
      /password|hash|token|secret/i.test(k)
    )
    expect(sensitiveKeys).toHaveLength(0)
  })

  test('returns 401 when not authenticated', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  test('returns 401 when getUser returns an error but no user', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Token expired'),
    })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  test('returns 404 when DB record is missing', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Not found')
  })

  test('returns 500 on internal server error', async () => {
    mockSupabaseAuth.getUser.mockRejectedValue(new Error('DB connection failed'))

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Internal Server Error')
  })

  test('passes FULL_PROFILE_SELECT through to Prisma', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockPrisma.user.findUnique.mockResolvedValue(mockProfile)

    await GET()

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockSupabaseUser.id },
      select: FULL_PROFILE_SELECT,
    })
  })
})
