const mockSupabaseAuth = { getUser: jest.fn() }
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({ auth: mockSupabaseAuth })),
}))

const mockRecipes = Array.from({ length: 6 }, (_, i) => ({
  id: `recipe-${i + 1}`,
  recipeName: `เมนู ${i + 1}`,
  rating: 5 - i * 0.1,
  favoriteCount: 10 - i,
  createdAt: new Date(),
  bgColor: null,
  images: [{ id: `img-${i + 1}`, imageUrl: `https://example.com/img-${i + 1}.jpg` }],
}))

const mockPrisma = {
  recipe: {
    findMany: jest.fn(),
  },
  searchHistory: {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { GET } from '@/app/api/recipes/featured/route'

describe('GET /api/recipes/featured', () => {
  const makeRequest = (query = '') => new Request(`http://localhost/api/recipes/featured${query}`)

  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.recipe.findMany.mockImplementation(({ take }: { take?: number } = {}) =>
      Promise.resolve(take ? mockRecipes.slice(0, take) : mockRecipes)
    )
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

    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { visibility: 'public' },
      })
    )
  })

  test('creates a SearchHistory cursor record for logged-in user', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockPrisma.searchHistory.findFirst.mockResolvedValue(null)
    mockPrisma.searchHistory.create.mockResolvedValue({ id: 'history-1' })

    const req = new Request('http://localhost/api/recipes/featured', { headers: { 'x-user-id': 'user-1' } })
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(mockPrisma.searchHistory.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        searchQuery: expect.stringContaining('__rec_cache__'),
      },
    })
  })

  test('updates existing SearchHistory cursor for logged-in user', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockPrisma.searchHistory.findFirst.mockResolvedValue({
      id: 'history-1',
      searchQuery: '__rec_cache__:invalid',
    })
    mockPrisma.searchHistory.update.mockResolvedValue({ id: 'history-1' })

    const req = new Request('http://localhost/api/recipes/featured', { headers: { 'x-user-id': 'user-1' } })
    await GET(req)

    expect(mockPrisma.searchHistory.create).not.toHaveBeenCalled()
    expect(mockPrisma.searchHistory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'history-1' },
      })
    )
  })

  test('returns 500 on internal server error', async () => {
    mockPrisma.recipe.findMany.mockRejectedValue(new Error('db down'))

    const res = await GET(makeRequest(''))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Internal server error')
  })
})
