const mockSupabaseAuth = { getUser: jest.fn() }
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({ auth: mockSupabaseAuth })),
}))

const mockPrisma = {
  favorite: { findMany: jest.fn() },
}
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { GET } from '@/app/api/favorites/route'

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

    expect(mockPrisma.favorite.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      include: {
        recipe: {
          include: {
            images: true,
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
            recipeIngredients: {
              include: { ingredient: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  })
})
