const mockSupabaseAuth = { getUser: jest.fn() }
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({ auth: mockSupabaseAuth })),
}))

const mockPrisma = {
  recipe: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  storePost: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
}
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { GET } from '@/app/api/recipes/route'

const mockRecipes = Array.from({ length: 3 }, (_, i) => ({
  id: `recipe-${i + 1}`,
  recipeName: `เมนู ${i + 1}`,
  rating: 4.5,
  favoriteCount: 5,
  createdAt: '2026-08-01T00:00:00.000Z',
  bgColor: null,
  images: [{ id: `img-${i + 1}`, imageUrl: 'https://example.com/img.jpg' }],
  user: { id: 'user-1', username: 'user1', avatarUrl: null },
}))

const makeRequest = (query = ''): Request =>
  new Request(`http://localhost/api/recipes${query}`)

describe('GET /api/recipes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.recipe.findMany.mockResolvedValue(mockRecipes)
    mockPrisma.recipe.count.mockResolvedValue(3)
    mockPrisma.storePost.findMany.mockResolvedValue([])
    mockPrisma.storePost.count.mockResolvedValue(0)
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'USER' })
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })
  })

  test('returns public feed with meta when no query params provided', async () => {
    const res = await GET(makeRequest(''))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual(mockRecipes)
    expect(body.meta).toEqual({ page: 1, limit: 10, total: 3, totalPages: 1 })

    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith({
      where: { visibility: { in: ['public', 'protected'] } },
      select: expect.objectContaining({
        id: true,
        recipeName: true,
        images: {
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { id: true, imageUrl: true },
        },
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      }),
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 10,
    })
  })

  test('applies pagination skip/take and meta', async () => {
    const res = await GET(makeRequest('?page=2&limit=5'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.meta).toEqual({ page: 2, limit: 5, total: 3, totalPages: 1 })
    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 })
    )
  })

  test('returns 400 for invalid params', async () => {
    const res = await GET(makeRequest('?limit=abc&page=0'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBeDefined()
    expect(mockPrisma.recipe.findMany).not.toHaveBeenCalled()
  })

  test('returns 401 for ?mine=true when unauthenticated', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })

    const res = await GET(makeRequest('?mine=true'))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
    expect(mockPrisma.recipe.findMany).not.toHaveBeenCalled()
  })

  test('filters by userId without visibility filter for ?mine=true', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    const res = await GET(makeRequest('?mine=true'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { OR: [{ userId: 'user-1' }, { storePosts: { some: { userId: 'user-1' } } }] } })
    )
    expect(mockPrisma.recipe.count).toHaveBeenCalledWith({
      where: { OR: [{ userId: 'user-1' }, { storePosts: { some: { userId: 'user-1' } } }] },
    })
    expect(body.meta.total).toBe(3)
  })

  test('returns 500 on internal server error', async () => {
    mockPrisma.recipe.findMany.mockRejectedValue(new Error('db down'))

    const res = await GET(makeRequest(''))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Internal server error')
  })
})
