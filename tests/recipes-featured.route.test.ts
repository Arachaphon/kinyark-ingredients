const mockSupabaseAuth = { getUser: jest.fn() }
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({ auth: mockSupabaseAuth })),
}))

const mockRecipes = Array.from({ length: 6 }, (_, i) => ({
  id: `recipe-${i + 1}`,
  recipeName: `เมนู ${i + 1}`,
  rating: 5 - i * 0.1,
  favoriteCount: 10 - i,
  reviewCount: 5 - i,
  createdAt: new Date(),
  bgColor: null,
  images: [{ id: `img-${i + 1}`, imageUrl: `https://example.com/img-${i + 1}.jpg` }],
  recipeIngredients: [],
}))

const mockPrisma = {
  recipe: {
    findMany: jest.fn(),
  },
  favorite: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  recipeIngredient: {
    findMany: jest.fn().mockResolvedValue([]),
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
    mockPrisma.recipe.findMany.mockImplementation(({ where, take }: { where?: { id?: string }; take?: number } = {}) => {
      if (where?.id) {
        const target = mockRecipes.find((r) => r.id === where.id)
        return Promise.resolve(target ? [target] : [])
      }
      return Promise.resolve(take ? mockRecipes.slice(0, take) : mockRecipes)
    })
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })
  })

  test('returns the top public recipe for anonymous user without writing cursor', async () => {
    const res = await GET(makeRequest(''))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.total).toBe(1)
    expect(body.data).toHaveLength(1)
    expect(body.data[0]).toMatchObject({
      id: expect.any(String),
      recipeName: expect.any(String),
      images: [{ id: expect.any(String), imageUrl: expect.any(String) }],
    })
    expect(mockPrisma.searchHistory.findFirst).not.toHaveBeenCalled()
  })

  test('queries only public recipes for anonymous user', async () => {
    await GET(makeRequest(''))

    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { visibility: 'public' },
      })
    )
  })

  test('returns exactly 1 recipe for logged-in user without signals (rating fallback)', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockPrisma.searchHistory.findFirst.mockResolvedValue(null)
    mockPrisma.searchHistory.create.mockResolvedValue({ id: 'history-1' })

    const req = new Request('http://localhost/api/recipes/featured', { headers: { 'x-user-id': 'user-1' } })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(mockPrisma.searchHistory.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        searchQuery: expect.stringContaining('__rec_cache__'),
      },
    })
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

  test('updates existing SearchHistory cursor for logged-in user when window changed', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockPrisma.searchHistory.findFirst.mockResolvedValue({
      id: 'history-1',
      searchQuery: '__rec_cache__:{"window":"1970-01-01T00:00:00.000Z","id":"recipe-1"}',
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

  test('reuses cached recommendation when window matches (no recompute)', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    const windowMs = 3 * 24 * 60 * 60 * 1000
    const now = Date.now()
    const windowKey = new Date(now - (now % windowMs)).toISOString()
    mockPrisma.searchHistory.findFirst.mockResolvedValue({
      id: 'history-1',
      searchQuery: `__rec_cache__:${JSON.stringify({ window: windowKey, id: 'recipe-1' })}`,
    })

    const req = new Request('http://localhost/api/recipes/featured', { headers: { 'x-user-id': 'user-1' } })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe('recipe-1')
    expect(mockPrisma.searchHistory.create).not.toHaveBeenCalled()
    expect(mockPrisma.searchHistory.update).not.toHaveBeenCalled()
  })

  test('tier 1: recommends recipe whose name matches a recent search, ranked by rating then favorites', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockPrisma.searchHistory.findMany.mockResolvedValue([{ searchQuery: 'ต้มยำ' }])
    mockPrisma.searchHistory.findFirst.mockResolvedValue(null)
    mockPrisma.recipe.findMany.mockImplementation(({ orderBy, take }: any) => {
      if (orderBy && take === 1) return Promise.resolve([{ id: 'tier1-recipe' }])
      return Promise.resolve([])
    })

    const req = new Request('http://localhost/api/recipes/featured', { headers: { 'x-user-id': 'user-1' } })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data[0].id).toBe('tier1-recipe')
    expect(mockPrisma.recipeIngredient.findMany).not.toHaveBeenCalled()
    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ recipeName: { contains: 'ต้มยำ', mode: 'insensitive' } }],
        }),
        orderBy: [{ rating: 'desc' }, { favoriteCount: 'desc' }],
      })
    )
  })

  test('tier 2: falls back to ingredient overlap with favorited recipes when no search match', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockPrisma.searchHistory.findMany.mockResolvedValue([]) // no searches → skip tier 1
    mockPrisma.favorite.findMany.mockResolvedValue([
      { recipeId: 'fav-a' },
      { recipeId: 'fav-b' },
    ])
    mockPrisma.recipeIngredient.findMany.mockResolvedValue([
      { ingredientId: 7 },
      { ingredientId: 9 },
    ])
    mockPrisma.searchHistory.findFirst.mockResolvedValue(null)
    let call = 0
    mockPrisma.recipe.findMany.mockImplementation(() => {
      call += 1
      // first findMany = tier 2 pick, second = unused fallback
      return Promise.resolve(call === 1 ? [{ id: 'tier2-recipe' }] : [])
    })

    const req = new Request('http://localhost/api/recipes/featured', { headers: { 'x-user-id': 'user-1' } })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data[0].id).toBe('tier2-recipe')
    expect(mockPrisma.recipeIngredient.findMany).toHaveBeenCalledWith({
      where: { recipeId: { in: ['fav-a', 'fav-b'] } },
      select: { ingredientId: true },
    })
    expect(mockPrisma.recipe.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          recipeIngredients: { some: { ingredientId: { in: [7, 9] } } },
        }),
        orderBy: [{ rating: 'desc' }, { favoriteCount: 'desc' }],
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