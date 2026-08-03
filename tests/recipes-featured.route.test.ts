const mockSupabaseAuth = { getUser: jest.fn() }
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({ auth: mockSupabaseAuth })),
}))

const mockPrisma = {
  recipe: { findMany: jest.fn() },
  user: { findUnique: jest.fn() },
  searchHistory: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { GET } from '@/app/api/recipes/featured/route'

const mockRecipes = Array.from({ length: 6 }, (_, i) => ({
  id: `recipe-${i + 1}`,
  recipeName: `เมนู ${i + 1}`,
  rating: 5 - i * 0.1,
  favoriteCount: 10 - i,
  createdAt: new Date(),
  bgColor: null,
  images: [{ id: `img-${i + 1}`, imageUrl: `https://example.com/img-${i + 1}.jpg` }],
}))

const makeRequest = (query = ''): Request =>
  new Request(`http://localhost/api/recipes/featured${query}`)

describe('GET /api/recipes/featured', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.recipe.findMany.mockResolvedValue(mockRecipes)
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })
  })

  test('returns featured recipes for anonymous user without writing cursor', async () => {
    const res = await GET(makeRequest(''))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.total).toBe(6)
    expect(body.data).toHaveLength(6)
    expect(body.data[0]).toMatchObject({
      id: expect.any(String),
      recipeName: expect.any(String),
      images: [{ id: expect.any(String), imageUrl: expect.any(String) }],
    })
    expect(mockPrisma.searchHistory.findFirst).not.toHaveBeenCalled()
  })

  test('respects limit query param', async () => {
    const res = await GET(makeRequest('?limit=3'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(3)
  })

  test('returns 400 for invalid limit', async () => {
    const res = await GET(makeRequest('?limit=abc'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBeDefined()
    expect(mockPrisma.recipe.findMany).not.toHaveBeenCalled()
  })

  test('queries only public recipes with first image as cover', async () => {
    await GET(makeRequest(''))

    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith({
      where: { visibility: { in: ['public', 'protected'] } },
      select: expect.any(Object),
      orderBy: [{ rating: 'desc' }, { favoriteCount: 'desc' }, { createdAt: 'desc' }],
    })
  })

  test('creates a SearchHistory cursor record for logged-in user', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockPrisma.searchHistory.findFirst.mockResolvedValue(null)
    mockPrisma.searchHistory.create.mockResolvedValue({ id: 'history-1' })

    const res = await GET(makeRequest(''))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(mockPrisma.searchHistory.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        searchQuery: '__featured__',
        featuredCursor: expect.any(Number),
      },
    })
    expect(body.cursor).toEqual(expect.any(Number))
  })

  test('updates existing SearchHistory cursor for logged-in user', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockPrisma.searchHistory.findFirst.mockResolvedValue({
      id: 'history-1',
      featuredCursor: 2,
    })
    mockPrisma.searchHistory.update.mockResolvedValue({ id: 'history-1' })

    await GET(makeRequest(''))

    expect(mockPrisma.searchHistory.create).not.toHaveBeenCalled()
    expect(mockPrisma.searchHistory.update).toHaveBeenCalledWith({
      where: { id: 'history-1' },
      data: { featuredCursor: expect.any(Number) },
    })
  })

  test('returns 500 on internal server error', async () => {
    mockPrisma.recipe.findMany.mockRejectedValue(new Error('db down'))

    const res = await GET(makeRequest(''))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Internal server error')
  })
})
