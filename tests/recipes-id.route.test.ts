const mockSupabaseAuth = { getUser: jest.fn() }
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({ auth: mockSupabaseAuth })),
}))

jest.mock('@/lib/storage', () => ({
  deleteFileByUrl: jest.fn(),
}))

const mockPrisma = {
  recipe: { findUnique: jest.fn(), delete: jest.fn() },
  favorite: { findUnique: jest.fn(), deleteMany: jest.fn() },
  $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  reviewLike: { deleteMany: jest.fn() },
  review: { findMany: jest.fn(), deleteMany: jest.fn() },
  recipeIngredient: { findMany: jest.fn(), deleteMany: jest.fn() },
  recipeEquipment: { findMany: jest.fn(), deleteMany: jest.fn() },
  recipeImage: { findMany: jest.fn(), deleteMany: jest.fn() },
  recipeVideo: { findMany: jest.fn(), deleteMany: jest.fn() },
  storePost: { findMany: jest.fn(), deleteMany: jest.fn() },
  storePostImage: { deleteMany: jest.fn() },
  storePostVideo: { deleteMany: jest.fn() },
}
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { GET, DELETE } from '@/app/api/recipes/[id]/route'
import { deleteFileByUrl } from '@/lib/storage'

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
  equipmentItems: [],
  images: [{ id: 'img-1', imageUrl: 'https://example.com/img-1.jpg' }],
  videos: [],
  reviews: [],
  storePosts: [],
}

const makeRequest = (): Request => new Request(`http://localhost/api/recipes/${UUID}`)

describe('GET /api/recipes/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.recipe.findUnique.mockResolvedValue(mockRecipe)
    mockPrisma.recipeIngredient.findMany.mockResolvedValue(mockRecipe.recipeIngredients)
    mockPrisma.recipeEquipment.findMany.mockResolvedValue(mockRecipe.equipmentItems)
    mockPrisma.recipeImage.findMany.mockResolvedValue(mockRecipe.images)
    mockPrisma.recipeVideo.findMany.mockResolvedValue(mockRecipe.videos)
    mockPrisma.review.findMany.mockResolvedValue(mockRecipe.reviews)
    mockPrisma.storePost.findMany.mockResolvedValue(mockRecipe.storePosts)
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
    expect(body.error).toBe('db down')
  })
})

describe('DELETE /api/recipes/[id]', () => {
  const deleteRecipe = {
    id: UUID,
    userId: 'user-owner',
    images: [{ id: 'img-1', imageUrl: 'https://pub/recipes/a.jpg' }],
    videos: [{ id: 'vid-1', videoUrl: 'https://pub/recipes/a.mp4' }],
    storePosts: [
      {
        id: 'sp-1',
        images: [{ id: 'simg-1', imageUrl: 'https://pub/recipes/s.jpg' }],
        videos: [{ id: 'svid-1', videoUrl: 'https://pub/recipes/s.mp4' }],
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.recipe.findUnique.mockResolvedValue(deleteRecipe)
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-owner' } },
      error: null,
    })
    jest.mocked(deleteFileByUrl).mockResolvedValue(true)
  })

  test('returns 401 when not authenticated', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await DELETE(makeRequest(), { params: Promise.resolve({ id: UUID }) })
    expect(res.status).toBe(401)
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  test('returns 400 when id is not a valid uuid', async () => {
    const res = await DELETE(makeRequest(), { params: Promise.resolve({ id: 'not-a-uuid' }) })
    expect(res.status).toBe(400)
    expect(mockPrisma.recipe.findUnique).not.toHaveBeenCalled()
  })

  test('returns 404 when recipe does not exist', async () => {
    mockPrisma.recipe.findUnique.mockResolvedValue(null)
    const res = await DELETE(makeRequest(), { params: Promise.resolve({ id: UUID }) })
    expect(res.status).toBe(404)
  })

  test('returns 403 when user is not the recipe owner', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-other' } },
      error: null,
    })
    const res = await DELETE(makeRequest(), { params: Promise.resolve({ id: UUID }) })
    expect(res.status).toBe(403)
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  test('deletes recipe, related relations and all store post media', async () => {
    const res = await DELETE(makeRequest(), { params: Promise.resolve({ id: UUID }) })
    expect(res.status).toBe(200)
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)

    const allUrls = [
      'https://pub/recipes/a.jpg',
      'https://pub/recipes/s.jpg',
      'https://pub/recipes/a.mp4',
      'https://pub/recipes/s.mp4',
    ]
    allUrls.forEach((url) => {
      expect(deleteFileByUrl).toHaveBeenCalledWith(expect.anything(), url)
    })
  })

  test('returns 500 on internal server error', async () => {
    mockPrisma.recipe.findUnique.mockRejectedValue(new Error('db down'))
    const res = await DELETE(makeRequest(), { params: Promise.resolve({ id: UUID }) })
    expect(res.status).toBe(500)
  })
})
