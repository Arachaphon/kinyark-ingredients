/* eslint-disable @typescript-eslint/no-explicit-any */
const mockSupabaseAuth = { getUser: jest.fn() }
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({ auth: mockSupabaseAuth })),
}))

const mockPrisma: any = {
  recipe: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  review: {
    findFirst: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn(),
  },
  $transaction: jest.fn((callback: any) => callback(mockPrisma)),
}
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { POST } from '@/app/api/reviews/route'

describe('POST /api/reviews', () => {
  const validRecipeId = 'a2f3c7c4-07e3-41c8-bfbe-494d014982b2'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns 401 when unauthenticated', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })

    const req = new Request('http://localhost/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipeId: validRecipeId,
        rating: 5,
        comment: 'Yummy!',
      }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  test('returns 400 when rating is out of bounds (1-5)', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    const req = new Request('http://localhost/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipeId: validRecipeId,
        rating: 6, // Invalid rating
      }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toContain('Rating must be at most 5')
  })

  test('returns 404 when recipe is not found', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockPrisma.recipe.findUnique.mockResolvedValue(null)

    const req = new Request('http://localhost/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipeId: validRecipeId,
        rating: 5,
      }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Recipe not found')
  })


  test('returns 409 when user attempts a duplicate review', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockPrisma.recipe.findUnique.mockResolvedValue({
      id: validRecipeId,
      userId: 'user-creator',
    })
    mockPrisma.review.findFirst.mockResolvedValue({
      id: 'existing-review-id',
      userId: 'user-1',
      recipeId: validRecipeId,
    })

    const req = new Request('http://localhost/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipeId: validRecipeId,
        rating: 5,
      }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.error).toBe('You have already reviewed this recipe')
  })

  test('creates review and updates recipe rating/count in transaction', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockPrisma.recipe.findUnique.mockResolvedValue({
      id: validRecipeId,
      userId: 'user-creator',
    })
    mockPrisma.review.findFirst.mockResolvedValue(null)

    const expectedReview = {
      id: 'new-review-id',
      recipeId: validRecipeId,
      userId: 'user-1',
      rating: 5,
      comment: 'Delicious!',
      isAnonymous: false,
      user: {
        id: 'user-1',
        username: 'chef-a',
        avatarUrl: null,
      },
    }

    mockPrisma.review.create.mockResolvedValue(expectedReview)
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 5 } })

    const req = new Request('http://localhost/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipeId: validRecipeId,
        rating: 5,
        comment: 'Delicious!',
      }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data).toEqual(expectedReview)

    expect(mockPrisma.$transaction).toHaveBeenCalled()
    expect(mockPrisma.review.create).toHaveBeenCalledWith({
      data: {
        recipeId: validRecipeId,
        userId: 'user-1',
        rating: 5,
        comment: 'Delicious!',
        isAnonymous: false,
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    })
    expect(mockPrisma.recipe.update).toHaveBeenNthCalledWith(1, {
      where: { id: validRecipeId },
      data: { reviewCount: { increment: 1 } },
    })
    expect(mockPrisma.recipe.update).toHaveBeenNthCalledWith(2, {
      where: { id: validRecipeId },
      data: { rating: 5 },
    })
  })
})
