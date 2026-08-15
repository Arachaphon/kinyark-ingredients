const mockPrisma = {
  recipe: {
    findUnique: jest.fn(),
  },
  review: {
    groupBy: jest.fn(),
  },
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

import { GET } from '@/app/api/recipes/[id]/ratings/route'

describe('GET /api/recipes/[id]/ratings', () => {
  const validRecipeId = 'a2f3c7c4-07e3-41c8-bfbe-494d014982b2'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns 400 when recipeId is invalid', async () => {
    const res = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'invalid-uuid' }),
    })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Invalid recipe ID')
  })

  test('returns 404 when recipe does not exist', async () => {
    mockPrisma.recipe.findUnique.mockResolvedValue(null)

    const res = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ id: validRecipeId }),
    })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Recipe not found')
  })

  test('returns ratings summary and star breakdown correctly', async () => {
    mockPrisma.recipe.findUnique.mockResolvedValue({
      id: validRecipeId,
      rating: 4.5,
      reviewCount: 10,
    })

    mockPrisma.review.groupBy.mockResolvedValue([
      { rating: 5, _count: { rating: 6 } },
      { rating: 4, _count: { rating: 3 } },
      { rating: 3, _count: { rating: 1 } },
    ])

    const res = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ id: validRecipeId }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual({
      recipeId: validRecipeId,
      averageRating: 4.5,
      totalReviews: 10,
      breakdown: {
        '5': 6,
        '4': 3,
        '3': 1,
        '2': 0,
        '1': 0,
      },
    })

    expect(mockPrisma.recipe.findUnique).toHaveBeenCalledWith({
      where: { id: validRecipeId },
      select: { id: true, rating: true, reviewCount: true },
    })

    expect(mockPrisma.review.groupBy).toHaveBeenCalledWith({
      by: ['rating'],
      where: { recipeId: validRecipeId },
      _count: { rating: true },
    })
  })
})
