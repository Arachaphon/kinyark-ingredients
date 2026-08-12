const mockSupabaseAuth = { getUser: jest.fn() }
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({ auth: mockSupabaseAuth })),
}))

const mockPrisma: any = {
  review: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
  },
  recipe: {
    update: jest.fn(),
  },
  $transaction: jest.fn((callback: any) => callback(mockPrisma)),
}
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { PATCH, DELETE } from '@/app/api/reviews/[id]/route'

describe('PATCH /api/reviews/[id]', () => {
  const validReviewId = 'review-123'
  const validRecipeId = 'recipe-456'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns 401 when unauthenticated', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })

    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 4 }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: validReviewId }) })
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  test('returns 404 when review not found', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })
    mockPrisma.review.findUnique.mockResolvedValue(null)

    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 4 }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: validReviewId }) })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Not found')
  })

  test('returns 403 when user is not owner of review', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })
    mockPrisma.review.findUnique.mockResolvedValue({ id: validReviewId, userId: 'other-user' })

    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 4 }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: validReviewId }) })
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })

  test('updates review and average recipe rating with rounding', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })
    mockPrisma.review.findUnique.mockResolvedValue({
      id: validReviewId,
      userId: 'user-123',
      recipeId: validRecipeId,
    })

    const expectedReview = { id: validReviewId, rating: 4, comment: 'Good' }
    mockPrisma.review.update.mockResolvedValue(expectedReview)
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4.333333333333333 } })

    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 4, comment: 'Good' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: validReviewId }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual(expectedReview)

    expect(mockPrisma.review.update).toHaveBeenCalledWith({
      where: { id: validReviewId },
      data: { rating: 4, comment: 'Good' },
    })

    // Rating rounded to 1 decimal place: 4.3333... -> 4.3
    expect(mockPrisma.recipe.update).toHaveBeenCalledWith({
      where: { id: validRecipeId },
      data: { rating: 4.3 },
    })
  })
})

describe('DELETE /api/reviews/[id]', () => {
  const validReviewId = 'review-123'
  const validRecipeId = 'recipe-456'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('deletes review, decrements count, and updates average rating in transaction', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })
    mockPrisma.review.findUnique.mockResolvedValue({
      id: validReviewId,
      userId: 'user-123',
      recipeId: validRecipeId,
    })
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4.666666666666667 } })

    const res = await DELETE(new Request('http://localhost'), {
      params: Promise.resolve({ id: validReviewId }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual({ id: validReviewId })

    expect(mockPrisma.review.delete).toHaveBeenCalledWith({ where: { id: validReviewId } })
    expect(mockPrisma.recipe.update).toHaveBeenNthCalledWith(1, {
      where: { id: validRecipeId },
      data: { reviewCount: { decrement: 1 } },
    })
    // Rating rounded: 4.666... -> 4.7
    expect(mockPrisma.recipe.update).toHaveBeenNthCalledWith(2, {
      where: { id: validRecipeId },
      data: { rating: 4.7 },
    })
  })
})
