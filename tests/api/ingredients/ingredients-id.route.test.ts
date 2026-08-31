const mockPrisma = {
  ingredient: { findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
  category: { findFirst: jest.fn(), create: jest.fn() },
  recipeIngredient: { count: jest.fn() },
}
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { GET, PATCH, DELETE } from '@/app/api/ingredients/[id]/route'

const params = { params: Promise.resolve({ id: '2' }) }
const req = (method: string, body?: unknown, id = '2'): Request =>
  new Request(`http://localhost/api/ingredients/${id}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

describe('GET /api/ingredients/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.ingredient.findUnique.mockResolvedValue({ id: 2, name: 'Chicken', categoryId: 2, category: { id: 2, name: 'Meat' } })
  })

  it('returns ingredient by id', async () => {
    const res = await GET(req('GET'), params)
    expect(res.status).toBe(200)
    expect(mockPrisma.ingredient.findUnique).toHaveBeenCalledWith({ where: { id: 2 }, include: { category: true } })
  })

  it('returns 400 for invalid id', async () => {
    const res = await GET(req('GET', undefined, 'abc'), { params: Promise.resolve({ id: 'abc' }) })
    expect(res.status).toBe(400)
  })

  it('returns 404 when ingredient missing', async () => {
    mockPrisma.ingredient.findUnique.mockResolvedValue(null)
    const res = await GET(req('GET', undefined, '99'), { params: Promise.resolve({ id: '99' }) })
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/ingredients/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.ingredient.findUnique.mockResolvedValue({ id: 2, name: 'Chicken', categoryId: 2 })
    mockPrisma.category.findFirst.mockResolvedValue({ id: 2, name: 'Meat' })
    mockPrisma.ingredient.update.mockResolvedValue({ id: 2, name: 'Chicken Breast', categoryId: 2, category: { id: 2, name: 'Meat' } })
  })

  it('updates ingredient name', async () => {
    const res = await PATCH(req('PATCH', { name: 'Chicken Breast' }), params)
    expect(res.status).toBe(200)
    expect(mockPrisma.ingredient.update).toHaveBeenCalledWith(expect.objectContaining({ data: { name: 'Chicken Breast' } }))
  })

  it('links a new category by name', async () => {
    mockPrisma.category.findFirst.mockResolvedValue(null)
    mockPrisma.category.create.mockResolvedValue({ id: 9, name: 'Herbs' })
    await PATCH(req('PATCH', { category: 'Herbs' }), params)
    expect(mockPrisma.ingredient.update).toHaveBeenCalledWith(expect.objectContaining({ data: { categoryId: 9 } }))
  })

  it('returns 404 when ingredient missing', async () => {
    mockPrisma.ingredient.findUnique.mockResolvedValue(null)
    const res = await PATCH(req('PATCH', { name: 'X' }), params)
    expect(res.status).toBe(404)
  })

  it('returns 400 on empty body', async () => {
    const res = await PATCH(req('PATCH', {}), params)
    expect(res.status).toBe(400)
    expect(mockPrisma.ingredient.update).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/ingredients/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.ingredient.findUnique.mockResolvedValue({ id: 2, name: 'Chicken', categoryId: 2 })
    mockPrisma.recipeIngredient.count.mockResolvedValue(0)
    mockPrisma.ingredient.delete.mockResolvedValue({ id: 2 })
  })

  it('deletes unused ingredient', async () => {
    const res = await DELETE(req('DELETE'), params)
    expect(res.status).toBe(200)
    expect(mockPrisma.ingredient.delete).toHaveBeenCalledWith({ where: { id: 2 } })
  })

  it('returns 409 when ingredient is used in recipes', async () => {
    mockPrisma.recipeIngredient.count.mockResolvedValue(3)
    const res = await DELETE(req('DELETE'), params)
    expect(res.status).toBe(409)
    expect(mockPrisma.ingredient.delete).not.toHaveBeenCalled()
  })

  it('returns 404 when ingredient missing', async () => {
    mockPrisma.ingredient.findUnique.mockResolvedValue(null)
    const res = await DELETE(req('DELETE'), params)
    expect(res.status).toBe(404)
  })
})