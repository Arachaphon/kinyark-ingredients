import { GET, POST } from '@/app/api/recipes/route'
import { GET as GET_BY_ID, PATCH, DELETE } from '@/app/api/recipes/[id]/route'
import { prisma } from '@/lib/prisma'
import { seedTestUser, cleanupDatabase, TestUser } from './setup'

jest.setTimeout(30000)

describe('Core Recipe Flow (CRUD) Integration Test', () => {
  const testUser: TestUser = {
    id: '11111111-1111-4111-a111-111111111111',
    email: 'recipe-tester@example.com',
    role: 'USER',
    username: 'recipetester',
  }

  let createdRecipeId: string

  beforeAll(async () => {
    // Setup test user in database
    await seedTestUser(testUser)
  })

  afterAll(async () => {
    // Clean up created records
    await cleanupDatabase()
    await prisma.$disconnect()
  })

  test('POST /api/recipes - creates a new recipe with ingredients and equipment', async () => {
    const payload = {
      recipeName: 'Integration Test Tom Yum',
      description: 'Spicy Thai Soup',
      instructions: '1. Boil water\n2. Add herbs and shrimp',
      visibility: 'public',
      ingredients: [
        { name: 'Shrimp', quantity: 200, unit: 'g' },
        { name: 'Lemongrass', quantity: 2, unit: 'stalks' },
      ],
      equipment: [
        { name: 'Soup Pot' },
      ],
      images: ['https://example.com/tomyum.jpg'],
    }

    const req = new Request('http://localhost/api/recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUser.id,
        'x-user-role': testUser.role,
      },
      body: JSON.stringify(payload),
    })

    const res = await POST(req)
    const body = await res.json()

    if (res.status !== 201) console.log('POST /api/recipes ERROR:', body)
    expect(res.status).toBe(201)
    
    const recipeData = body.data || body
    expect(recipeData.recipeName).toBe(payload.recipeName)
    expect(recipeData.userId).toBe(testUser.id)
    expect(recipeData.images).toHaveLength(1)

    createdRecipeId = body.data.id

    // Direct DB Verification
    const dbRecipe = await prisma.recipe.findUnique({
      where: { id: createdRecipeId },
      include: {
        recipeIngredients: { include: { ingredient: true } },
        equipmentItems: true,
        images: true,
      },
    })

    expect(dbRecipe).not.toBeNull()
    expect(dbRecipe?.recipeName).toBe(payload.recipeName)
    expect(dbRecipe?.recipeIngredients).toHaveLength(2)
  })

  test('GET /api/recipes/[id] - retrieves detail with relations', async () => {
    const req = new Request(`http://localhost/api/recipes/${createdRecipeId}`, {
      headers: {
        'x-user-id': testUser.id,
        'x-user-role': testUser.role,
      },
    })
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: createdRecipeId }) } as any)
    const body = await res.json()
    const recipeData = body.data || body

    expect(res.status).toBe(200)
    expect(recipeData.id).toBe(createdRecipeId)
    expect(recipeData.recipeName).toBe('Integration Test Tom Yum')
    expect(recipeData.user.username).toBe(testUser.username)
  })

  test('PATCH /api/recipes/[id] - updates recipe details', async () => {
    const updatePayload = {
      recipeName: 'Integration Test Tom Yum Kung (Updated)',
      visibility: 'private',
    }

    const req = new Request(`http://localhost/api/recipes/${createdRecipeId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUser.id,
        'x-user-role': testUser.role,
      },
      body: JSON.stringify(updatePayload),
    })

    const res = await PATCH(req, { params: Promise.resolve({ id: createdRecipeId }) } as any)
    const body = await res.json()
    const recipeData = body.data || body

    expect(res.status).toBe(200)
    expect(recipeData.recipeName).toBe(updatePayload.recipeName)
    expect(recipeData.visibility).toBe('private')

    // Verify DB update
    const dbRecipe = await prisma.recipe.findUnique({ where: { id: createdRecipeId } })
    expect(dbRecipe?.recipeName).toBe(updatePayload.recipeName)
    expect(dbRecipe?.visibility).toBe('private')
  })

  test('GET /api/recipes - filters and lists recipes', async () => {
    const req = new Request(`http://localhost/api/recipes?mine=true`, {
      headers: {
        'x-user-id': testUser.id,
        'x-user-role': testUser.role,
      },
    })

    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toBeDefined()
    expect(body.data.some((r: { id: string }) => r.id === createdRecipeId)).toBe(true)
  })

  test('DELETE /api/recipes/[id] - cascades delete associated entities', async () => {
    const req = new Request(`http://localhost/api/recipes/${createdRecipeId}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': testUser.id,
        'x-user-role': testUser.role,
      },
    })

    const res = await DELETE(req, { params: Promise.resolve({ id: createdRecipeId }) } as any)
    const body = await res.json()
    const deleteResult = body.data || body

    expect(res.status).toBe(200)
    expect(deleteResult.success).toBe(true)

    // Direct DB Verification of Cascade Delete
    const dbRecipe = await prisma.recipe.findUnique({ where: { id: createdRecipeId } })
    expect(dbRecipe).toBeNull()

    const dbIngredients = await prisma.recipeIngredient.findMany({
      where: { recipeId: createdRecipeId },
    })
    expect(dbIngredients).toHaveLength(0)
  })
})
