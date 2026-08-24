const mockSupabaseAuth = { getUser: jest.fn() }
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({ auth: mockSupabaseAuth })),
}))

const mockPrisma = {
  favorite: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  recipe: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
}
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { GET, POST } from '@/app/api/favorites/route'

const mockFavorites = [
  {
    id: 'fav-1',
    userId: 'user-1',
    recipeId: 'recipe-1',
    createdAt: '2026-08-01T00:00:00.000Z',
    recipe: {
      id: 'recipe-1',
      recipeName: 'เมนู 1',
      rating: 4.5,
      images: [{ id: 'img-1', imageUrl: 'https://example.com/img.jpg' }],
      user: { id: 'user-1', username: 'user1', avatarUrl: null },
      recipeIngredients: [
        {
          id: 'ri-1',
          quantity: 2,
          unit: 'ช้อน',
          ingredient: { id: 1, name: 'ไข่' },
        },
      ],
    },
  },
]

describe('GET /api/favorites', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.favorite.findMany.mockResolvedValue(mockFavorites)
  })

  test('returns 401 when unauthenticated', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
    expect(mockPrisma.favorite.findMany).not.toHaveBeenCalled()
  })

  test('returns favorites with recipe user, ingredients, images and rating', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual(mockFavorites)
    expect(body.data[0].recipe.rating).toBe(4.5)
    expect(body.data[0].recipe.user.username).toBe('user1')
    expect(body.data[0].recipe.recipeIngredients[0].ingredient.name).toBe('ไข่')

    expect(mockPrisma.favorite.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
      })
    )
  })

  const validRecipeId = 'a2f3c7c4-07e3-41c8-bfbe-494d014982b2'

  test('GET status: returns 401 when unauthenticated', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    mockPrisma.recipe.findUnique.mockResolvedValue({ id: validRecipeId })
    const req = new Request(`http://localhost/api/favorites?recipeId=${validRecipeId}&action=status`)
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  test('GET status/count: returns 400 when params are invalid', async () => {
    // Invalid action
    const req1 = new Request(`http://localhost/api/favorites?recipeId=${validRecipeId}&action=invalid`)
    const res1 = await GET(req1)
    const body1 = await res1.json()
    expect(res1.status).toBe(400)
    expect(body1.error).toContain('status')

    // Invalid UUID
    const req2 = new Request(`http://localhost/api/favorites?recipeId=not-a-uuid&action=status`)
    const res2 = await GET(req2)
    const body2 = await res2.json()
    expect(res2.status).toBe(400)
    expect(body2.error).toContain('Invalid recipe ID')
  })

  test('GET status/count: returns 404 when recipe is not found', async () => {
    mockPrisma.recipe.findUnique.mockResolvedValue(null)
    const req = new Request(`http://localhost/api/favorites?recipeId=${validRecipeId}&action=status`)
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(404)
    expect(body.error).toBe('Recipe not found')
  })

  test('GET status: returns true when already favorited', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockPrisma.recipe.findUnique.mockResolvedValue({ id: validRecipeId })
    mockPrisma.favorite.findUnique.mockResolvedValue({ id: 'fav-1' })

    const req = new Request(`http://localhost/api/favorites?recipeId=${validRecipeId}&action=status`)
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toEqual({ isFavorite: true })
  })

  test('GET status: returns false when not favorited', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockPrisma.recipe.findUnique.mockResolvedValue({ id: validRecipeId })
    mockPrisma.favorite.findUnique.mockResolvedValue(null)

    const req = new Request(`http://localhost/api/favorites?recipeId=${validRecipeId}&action=status`)
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toEqual({ isFavorite: false })
  })

  test('GET count: returns count of favorites (public)', async () => {
    mockPrisma.recipe.findUnique.mockResolvedValue({ id: validRecipeId })
    mockPrisma.favorite.count.mockResolvedValue(10)

    const req = new Request(`http://localhost/api/favorites?recipeId=${validRecipeId}&action=count`)
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toEqual({ recipeId: validRecipeId, count: 10 })
  })
})

describe('POST /api/favorites', () => {
  const validRecipeId = 'a2f3c7c4-07e3-41c8-bfbe-494d014982b2'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns 401 when unauthenticated', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })

    const req = new Request('http://localhost/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId: validRecipeId }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  test('returns 400 when recipeId is missing or not a valid UUID', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    // Missing recipeId
    const req1 = new Request('http://localhost/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res1 = await POST(req1)
    const body1 = await res1.json()
    expect(res1.status).toBe(400)
    expect(body1.error).toContain('Invalid recipe ID')

    // Invalid UUID
    const req2 = new Request('http://localhost/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId: 'not-a-uuid' }),
    })
    const res2 = await POST(req2)
    const body2 = await res2.json()
    expect(res2.status).toBe(400)
    expect(body2.error).toContain('Invalid recipe ID')
  })

  test('returns 404 when recipe is not found', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockPrisma.recipe.findUnique.mockResolvedValue(null)

    const req = new Request('http://localhost/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId: validRecipeId }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Recipe not found')
    expect(mockPrisma.recipe.findUnique).toHaveBeenCalledWith({
      where: { id: validRecipeId },
      select: { id: true },
    })
  })

  test('creates favorite and increments count when not already favorited', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockPrisma.recipe.findUnique.mockResolvedValue({ id: validRecipeId, recipeName: 'Test' })
    mockPrisma.favorite.findUnique.mockResolvedValue(null)
    mockPrisma.favorite.create.mockResolvedValue({ id: 'fav-new', userId: 'user-1', recipeId: validRecipeId })
    mockPrisma.recipe.update.mockResolvedValue({ id: validRecipeId, favoriteCount: 1 })
    mockPrisma.favorite.count.mockResolvedValue(1)

    const req = new Request('http://localhost/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId: validRecipeId }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data).toEqual({ favorited: true, favoriteCount: 1 })
    expect(mockPrisma.favorite.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', recipeId: validRecipeId },
    })
    expect(mockPrisma.recipe.update).toHaveBeenCalledWith({
      where: { id: validRecipeId },
      data: { favoriteCount: { increment: 1 } },
    })
  })

  test('deletes favorite and decrements count when already favorited', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockPrisma.recipe.findUnique.mockResolvedValue({ id: validRecipeId })
    // Simulate duplicate (userId, recipeId) → unique constraint violation (P2002)
    mockPrisma.favorite.create.mockRejectedValue({ code: 'P2002' })
    mockPrisma.favorite.delete.mockResolvedValue({ id: 'fav-existing' })
    mockPrisma.recipe.update.mockResolvedValue({ id: validRecipeId, favoriteCount: 0 })
    mockPrisma.favorite.count.mockResolvedValue(0)

    const req = new Request('http://localhost/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId: validRecipeId }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual({ favorited: false, favoriteCount: 0 })
    expect(mockPrisma.favorite.delete).toHaveBeenCalledWith({
      where: { userId_recipeId: { userId: 'user-1', recipeId: validRecipeId } },
    })
    expect(mockPrisma.recipe.update).toHaveBeenCalledWith({
      where: { id: validRecipeId },
      data: { favoriteCount: { decrement: 1 } },
    })
  })

  test('toggles a recipe that already exists back to unfavorited', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockPrisma.recipe.findUnique.mockResolvedValue({ id: validRecipeId })
    mockPrisma.favorite.create.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['userId_recipeId'] },
    })
    mockPrisma.favorite.delete.mockResolvedValue({ id: 'fav-1', userId: 'user-1', recipeId: validRecipeId })
    mockPrisma.recipe.update.mockResolvedValue({ id: validRecipeId, favoriteCount: 0 })
    mockPrisma.favorite.count.mockResolvedValue(0)

    const req = new Request('http://localhost/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId: validRecipeId }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual({ favorited: false, favoriteCount: 0 })
    expect(mockPrisma.favorite.delete).toHaveBeenCalledWith({
      where: { userId_recipeId: { userId: 'user-1', recipeId: validRecipeId } },
    })
    expect(mockPrisma.recipe.update).toHaveBeenCalledWith({
      where: { id: validRecipeId },
      data: { favoriteCount: { decrement: 1 } },
    })
  })
})
