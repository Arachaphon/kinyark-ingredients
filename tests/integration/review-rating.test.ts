import { POST as POST_RECIPE } from '@/app/api/recipes/route'
import { POST as POST_REVIEW } from '@/app/api/reviews/route'
import { PATCH as PATCH_REVIEW, DELETE as DELETE_REVIEW } from '@/app/api/reviews/[id]/route'
import { prisma } from '@/lib/prisma'
import { seedTestUser, cleanupDatabase, TestUser } from './setup'

jest.setTimeout(30000)

describe('Review & Rating Flow Integration Test', () => {
  const authorUser: TestUser = {
    id: '22222222-2222-4222-a222-222222222222',
    email: 'author@example.com',
    role: 'USER',
    username: 'recipeauthor',
  }

  const reviewerUser: TestUser = {
    id: '33333333-3333-4333-a333-333333333333',
    email: 'reviewer@example.com',
    role: 'USER',
    username: 'foodreviewer',
  }

  let recipeId: string
  let reviewId: string

  beforeAll(async () => {
    await seedTestUser(authorUser)
    await seedTestUser(reviewerUser)

    // Create a target recipe for reviews
    const createReq = new Request('http://localhost/api/recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': authorUser.id,
        'x-user-role': authorUser.role,
      },
      body: JSON.stringify({
        recipeName: 'Pad Thai for Review Test',
        visibility: 'public',
        ingredients: [
          { name: 'Noodles', quantity: 100, unit: 'g' },
        ],
      }),
    })

    const res = await POST_RECIPE(createReq)
    const body = await res.json()
    recipeId = body.data.id
  })

  afterAll(async () => {
    await cleanupDatabase()
    await prisma.$disconnect()
  })

  test('POST /api/reviews - creates review and updates recipe rating/reviewCount', async () => {
    const req = new Request('http://localhost/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': reviewerUser.id,
        'x-user-role': reviewerUser.role,
      },
      body: JSON.stringify({
        recipeId,
        rating: 4,
        comment: 'Delicious Pad Thai!',
      }),
    })

    const res = await POST_REVIEW(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    const reviewData = body.data || body
    expect(reviewData.rating).toBe(4)
    expect(reviewData.userId).toBe(reviewerUser.id)
    reviewId = reviewData.id

    // DB Verification of recalculation
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } })
    expect(recipe?.reviewCount).toBe(1)
    expect(recipe?.rating).toBe(4)
  })

  test('PATCH /api/reviews/[id] - updates review rating and recalculates recipe average rating', async () => {
    const req = new Request(`http://localhost/api/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': reviewerUser.id,
        'x-user-role': reviewerUser.role,
      },
      body: JSON.stringify({
        rating: 5,
        comment: 'Even better on second thought!',
      }),
    })

    const res = await PATCH_REVIEW(req, { params: Promise.resolve({ id: reviewId }) } as { params: Promise<{ id: string }> })
    const body = await res.json()
    const reviewData = body.data || body

    expect(res.status).toBe(200)
    expect(reviewData.rating).toBe(5)

    // DB Verification
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } })
    expect(recipe?.reviewCount).toBe(1)
    expect(recipe?.rating).toBe(5)
  })

  test('DELETE /api/reviews/[id] - deletes review and decrements recipe statistics', async () => {
    const req = new Request(`http://localhost/api/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': reviewerUser.id,
        'x-user-role': reviewerUser.role,
      },
    })

    const res = await DELETE_REVIEW(req, { params: Promise.resolve({ id: reviewId }) } as { params: Promise<{ id: string }> })
    const body = await res.json()
    const deleteResult = body.data || body

    expect(res.status).toBe(200)
    expect(deleteResult.id).toBe(reviewId)

    // DB Verification of review deletion and rating decrement/reset
    const deletedReview = await prisma.review.findUnique({ where: { id: reviewId } })
    expect(deletedReview).toBeNull()

    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } })
    expect(recipe?.reviewCount).toBe(0)
    expect(recipe?.rating).toBe(0)
  })
})
