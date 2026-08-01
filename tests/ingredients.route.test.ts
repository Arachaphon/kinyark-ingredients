const mockPrisma = {
  ingredient: { findMany: jest.fn() },
}
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { GET } from '@/app/api/ingredients/route'

const mockIngredients = [
  {
    id: 1,
    name: 'Chicken Breast',
    categoryId: 2,
    category: { id: 2, name: 'Meat' },
  },
]

const makeRequest = (query: string): Request =>
  new Request(`http://localhost/api/ingredients${query}`)

describe('GET /api/ingredients', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.ingredient.findMany.mockResolvedValue(mockIngredients)
  })

  test('returns all ingredients when no query params provided', async () => {
    const res = await GET(makeRequest(''))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual(mockIngredients)
    expect(mockPrisma.ingredient.findMany).toHaveBeenCalledWith({
      where: {},
      include: { category: true },
      orderBy: { name: 'asc' },
    })
  })

  test('filters by categoryId', async () => {
    const res = await GET(makeRequest('?categoryId=2'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual(mockIngredients)
    expect(mockPrisma.ingredient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { categoryId: 2 },
      })
    )
  })

  test('filters by category name (case insensitive)', async () => {
    const res = await GET(makeRequest('?category=Meat'))

    expect(res.status).toBe(200)
    expect(mockPrisma.ingredient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          category: {
            name: { equals: 'Meat', mode: 'insensitive' },
          },
        },
      })
    )
  })

  test('filters by search', async () => {
    await GET(makeRequest('?search=chicken'))

    expect(mockPrisma.ingredient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          name: { contains: 'chicken', mode: 'insensitive' },
        },
      })
    )
  })

  test('returns 400 for invalid categoryId', async () => {
    const res = await GET(makeRequest('?categoryId=abc'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBeDefined()
    expect(mockPrisma.ingredient.findMany).not.toHaveBeenCalled()
  })

  test('returns 500 on internal server error', async () => {
    mockPrisma.ingredient.findMany.mockRejectedValue(new Error('db down'))

    const res = await GET(makeRequest(''))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Internal server error')
  })
})
