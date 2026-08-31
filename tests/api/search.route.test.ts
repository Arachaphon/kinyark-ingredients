const mockSupabaseAuth = { getUser: jest.fn() }
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({ auth: mockSupabaseAuth })),
}))

const mockPrisma = {
  recipe: {
    findMany: jest.fn(),
  },
  storePost: {
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
}
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { GET } from '@/app/api/search/route'

describe('GET /api/search visibility filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.recipe.findMany.mockResolvedValue([])
    mockPrisma.storePost.findMany.mockResolvedValue([])
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })
  })

  test('excludes draft and protected for STORE users in ingredient search', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'STORE' })
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: { id: 'store-1' } }, error: null })

    const req = new Request('http://localhost/api/search?ingredients=%E0%B9%84%E0%B8%81%E0%B9%88', {
      headers: { 'x-user-id': 'store-1', 'x-user-role': 'authenticated' },
    })

    await GET(req)

    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { visibility: { not: 'draft' } },
            {
              OR: [
                { visibility: 'public' },
                { userId: 'store-1', visibility: 'private' },
              ],
            },
          ]),
        }),
      })
    )
  })

  test('includes protected for USER role in ingredient search', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'USER' })
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    const req = new Request('http://localhost/api/search?ingredients=%E0%B9%84%E0%B8%81%E0%B9%88', {
      headers: { 'x-user-id': 'user-1', 'x-user-role': 'authenticated' },
    })

    await GET(req)

    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { visibility: { not: 'draft' } },
            {
              OR: [
                { visibility: { in: ['public', 'protected'] } },
                { userId: 'user-1', visibility: 'private' },
              ],
            },
          ]),
        }),
      })
    )
  })
})
