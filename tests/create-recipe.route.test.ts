const mockSupabaseAuth = { getUser: jest.fn() }
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({ auth: mockSupabaseAuth })),
}))

const mockPrismaTransaction = jest.fn()
const mockPrisma = {
  $transaction: mockPrismaTransaction,
  ingredient: { upsert: jest.fn() },
  recipe: { create: jest.fn() },
}
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { POST } from '@/app/api/recipes/route'

describe('POST /api/recipes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns 401 when not authenticated', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null } })
    const request = new Request('http://localhost/api/recipes', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const res = await POST(request)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  test('returns 400 on validation error', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    const request = new Request('http://localhost/api/recipes', {
      method: 'POST',
      body: JSON.stringify({ recipeName: '' }), // Missing required fields and empty name
    })

    const res = await POST(request)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBeDefined()
  })

  test('returns 201 on successful creation', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    
    const validPayload = {
      recipeName: 'Test Recipe',
      ingredients: [{ name: 'Salt', quantity: 1, unit: 'tsp' }]
    }
    const request = new Request('http://localhost/api/recipes', {
      method: 'POST',
      body: JSON.stringify(validPayload),
    })

    const mockCreatedRecipe = { id: 'recipe-123', recipeName: 'Test Recipe' }
    mockPrismaTransaction.mockImplementation(async (callback) => {
      // Simulate the transaction callback behavior by providing a mock transaction client
      return callback({
        ingredient: {
          upsert: jest.fn().mockResolvedValue({ id: 'ing-1', name: 'Salt' }),
        },
        recipe: {
          create: jest.fn().mockResolvedValue(mockCreatedRecipe),
        }
      })
    })

    const res = await POST(request)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data).toEqual(mockCreatedRecipe)
    expect(mockPrismaTransaction).toHaveBeenCalled()
  })

  test('returns 500 on database failure', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    
    const validPayload = {
      recipeName: 'Test Recipe',
      ingredients: [{ name: 'Salt', quantity: 1, unit: 'tsp' }]
    }
    const request = new Request('http://localhost/api/recipes', {
      method: 'POST',
      body: JSON.stringify(validPayload),
    })

    // Simulate database failure during transaction setup
    mockPrismaTransaction.mockRejectedValue(new Error('Database connection failed'))

    const res = await POST(request)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Internal server error')
  })

  test('rolls back transaction on inner failure', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    
    const validPayload = {
      recipeName: 'Test Recipe',
      ingredients: [{ name: 'Salt', quantity: 1, unit: 'tsp' }]
    }
    const request = new Request('http://localhost/api/recipes', {
      method: 'POST',
      body: JSON.stringify(validPayload),
    })

    mockPrismaTransaction.mockImplementation(async (callback) => {
      return callback({
        ingredient: {
          upsert: jest.fn().mockResolvedValue({ id: 'ing-1', name: 'Salt' }),
        },
        recipe: {
          create: jest.fn().mockRejectedValue(new Error('Transaction aborted')),
        }
      })
    })

    const res = await POST(request)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Internal server error')
  })
})
