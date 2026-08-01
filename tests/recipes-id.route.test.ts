const mockSupabaseAuth = { getUser: jest.fn() }
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({ auth: mockSupabaseAuth })),
}))

jest.mock('@/lib/storage', () => ({
  deleteFileByUrl: jest.fn(),
}))

const mockPrisma = {
  recipe: { findUnique: jest.fn() },
  favorite: { findUnique: jest.fn() },
}
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { GET } from '@/app/api/recipes/[id]/route'

const UUID = '9c1b1e2a-8f3a-4c7d-b5d1-3e2f9a0c6d4e'

const mockRecipe = {
  id: UUID,
  userId: 'user-owner',
  recipeName: 'มีตโลฟแมคแอนด์ชีส',
  description: 'อร่อยมาก',
  instructions: 'step 1',
  rating: 4.5,
  reviewCount: 2,
  favoriteCount: 3,
  bgColor: null,
  aiProvider: null,
  visibility: 'public',
  createdAt: '2026-08-01T00:00:00.000Z',
  user: { id: 'user-owner', username: 'Ratatouille', avatarUrl: null },
  recipeIngredients: [
    { id: 'ri-1', quantity: 2, unit: 'ฟอง', ingredient: { id: 1, name: 'ไข่', categoryId: null } },
  ],
  equipmentItems: [{ id: 'eq-1', name: 'กระทะ' }],
  images: [{ id: 'img-1', imageUrl: 'https://example.com/img.jpg' }],
  videos: [],
  reviews: [{ id: 'rv-1', userId: 'user-1', rating: 5, comment: 'ดีมาก', isAnonymous: false, user: { id: 'user-1', username: 'John', avatarUrl: null } }],
  storePosts: [],
}

const makeRequest = (): Request => new Request(`http://localhost/api/recipes/${UUID}`)

describe('GET /api/recipes/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.recipe.findUnique.mockResolvedValue(mockRecipe)
    mockPrisma.favorite.findUnique.mockResolvedValue(null)
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })
  })

  test('returns full recipe for anonymous user without isFavorite', async () => {
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: UUID }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual(expect.objectContaining({ id: UUID, recipeName: mockRecipe.recipeName }))
    expect(body.data.isFavorite).toBe(false)
    expect(mockPrisma.favorite.findUnique).not.toHaveBeenCalled()
  })

  test('computes isFavorite for logged-in user', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockPrisma.favorite.findUnique.mockResolvedValue({ id: 'fav-1' })

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: UUID }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.isFavorite).toBe(true)
    expect(mockPrisma.favorite.findUnique).toHaveBeenCalledWith({
      where: { userId_recipeId: { userId: 'user-1', recipeId: UUID } },
    })
  })

  test('allows owner to view a private recipe', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-owner' } },
      error: null,
    })
    mockPrisma.recipe.findUnique.mockResolvedValue({ ...mockRecipe, visibility: 'private' })

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: UUID }) })

    expect(res.status).toBe(200)
  })

  test('returns 404 for private recipe accessed by non-owner', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-other' } },
      error: null,
    })
    mockPrisma.recipe.findUnique.mockResolvedValue({ ...mockRecipe, visibility: 'private' })

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: UUID }) })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Recipe not found')
  })

  test('returns 404 when recipe does not exist', async () => {
    mockPrisma.recipe.findUnique.mockResolvedValue(null)

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: UUID }) })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Recipe not found')
  })

  test('returns 400 for invalid id', async () => {
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: 'not-a-uuid' }) })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Invalid recipe ID')
    expect(mockPrisma.recipe.findUnique).not.toHaveBeenCalled()
  })

  test('returns 500 on internal server error', async () => {
    mockPrisma.recipe.findUnique.mockRejectedValue(new Error('db down'))

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: UUID }) })
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Internal server error')
  })
})
