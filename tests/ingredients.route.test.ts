const mockPrisma = {
  ingredient: { findMany: jest.fn(), upsert: jest.fn() },
  category: { findFirst: jest.fn(), create: jest.fn() },
}
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { GET, POST } from '@/app/api/ingredients/route'

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

describe('POST /api/ingredients', () => {
  const postRequest = (body: unknown): Request =>
    new Request('http://localhost/api/ingredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.category.findFirst.mockResolvedValue(null)
    mockPrisma.category.create.mockResolvedValue({ id: 5, name: 'Meat' })
    mockPrisma.ingredient.upsert.mockResolvedValue({
      id: 1,
      name: 'Chicken',
      categoryId: 5,
      category: { id: 5, name: 'Meat' },
    })
  })

  test('creates ingredient and resolves category by name', async () => {
    const res = await POST(postRequest({ name: 'Chicken', category: 'Meat' }))
    expect(res.status).toBe(200)
    expect(mockPrisma.category.findFirst).toHaveBeenCalled()
    expect(mockPrisma.ingredient.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: { name: 'Chicken', categoryId: 5 } }))
  })

  test('links to an existing category by name', async () => {
    mockPrisma.category.findFirst.mockResolvedValue({ id: 2, name: 'Meat' })
    await POST(postRequest({ name: 'Chicken', category: 'Meat' }))
    expect(mockPrisma.ingredient.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: { name: 'Chicken', categoryId: 2 } }))
  })

  test('uses categoryId directly when provided', async () => {
    await POST(postRequest({ name: 'Chicken', categoryId: 7 }))
    expect(mockPrisma.category.findFirst).not.toHaveBeenCalled()
    expect(mockPrisma.ingredient.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: { name: 'Chicken', categoryId: 7 } }))
  })

  test('creates ingredient without category', async () => {
    await POST(postRequest({ name: 'Chicken' }))
    expect(mockPrisma.category.findFirst).not.toHaveBeenCalled()
    expect(mockPrisma.ingredient.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: { name: 'Chicken', categoryId: null } }))
  })

  test('returns 400 for invalid body', async () => {
    const res = await POST(postRequest({}))
    expect(res.status).toBe(400)
    expect(mockPrisma.ingredient.upsert).not.toHaveBeenCalled()
  })

  test('returns 400 when both category and categoryId provided', async () => {
    const res = await POST(postRequest({ name: 'X', category: 'Meat', categoryId: 2 }))
    expect(res.status).toBe(400)
  })

  test('returns 500 on internal server error', async () => {
    mockPrisma.ingredient.upsert.mockRejectedValue(new Error('db down'))
    const res = await POST(postRequest({ name: 'Chicken' }))
    expect(res.status).toBe(500)
  })
})
