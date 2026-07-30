import { GET, PATCH } from '@/app/api/users/me/route'
import { FULL_PROFILE_SELECT } from '@/lib/profile'

// ประกาศ Mock Functions
const mockGetUser = jest.fn()
const mockSignInWithPassword = jest.fn()
const mockUpdateUser = jest.fn()
const mockFindUnique = jest.fn()
const mockUpdate = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
  })),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}))

const mockProfile = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  username: 'testuser',
  email: 'testuser@example.com',
  avatarUrl: null,
  role: 'USER',
  createdAt: '2025-01-15T08:30:00.000Z',
}

const mockSupabaseUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'testuser@example.com',
}

function createPatchRequest(body: unknown): Request {
  return new Request('http://localhost/api/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/users/me', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns 200 with full profile when authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockFindUnique.mockResolvedValue(mockProfile)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.user).toEqual(mockProfile)
  })

  test('does not leak password or sensitive fields', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockFindUnique.mockResolvedValue(mockProfile)

    const res = await GET()
    const body = await res.json()

    expect(body.user.password).toBeUndefined()
    const sensitiveKeys = Object.keys(body.user).filter((k) =>
      /password|hash|token|secret/i.test(k)
    )
    expect(sensitiveKeys).toHaveLength(0)
  })

  test('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  test('returns 401 when getUser returns an error but no user', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Token expired'),
    })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  test('returns 404 when DB record is missing', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockFindUnique.mockResolvedValue(null)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Not found')
  })

  test('returns 500 on internal server error', async () => {
    mockGetUser.mockRejectedValue(new Error('DB connection failed'))

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Internal Server Error')
  })

  test('passes FULL_PROFILE_SELECT through to Prisma', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockFindUnique.mockResolvedValue(mockProfile)

    await GET()

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: mockSupabaseUser.id },
      select: FULL_PROFILE_SELECT,
    })
  })
})

describe('PATCH /api/users/me', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const res = await PATCH(createPatchRequest({ username: 'newname' }))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  test('returns 400 for malformed JSON', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })

    const req = new Request('http://localhost/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })
    const res = await PATCH(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Bad Request')
  })

  test('returns 400 when username is too short', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })

    const res = await PATCH(createPatchRequest({ username: 'a' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toContain('ชื่อผู้ใช้')
  })

  test('returns 400 when username is too long', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })

    const res = await PATCH(createPatchRequest({ username: 'a'.repeat(31) }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toContain('ยาวเกินไป')
  })

  test('returns 400 for invalid email', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })

    const res = await PATCH(createPatchRequest({ email: 'not-an-email' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toContain('อีเมล')
  })

  test('returns 400 for invalid avatarUrl', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })

    const res = await PATCH(createPatchRequest({ avatarUrl: 'not-a-url' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toContain('URL')
  })

  test('returns 400 for empty request body', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })

    const res = await PATCH(createPatchRequest({}))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toContain('ไม่มีข้อมูล')
  })

  test('returns 400 when only currentPassword is provided', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })

    const res = await PATCH(createPatchRequest({ currentPassword: 'somepass' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toContain('ไม่มีข้อมูล')
  })

  test('returns 400 when newPassword is provided without currentPassword', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })

    const res = await PATCH(createPatchRequest({ newPassword: 'NewPass1!' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toContain('รหัสผ่านปัจจุบัน')
  })

  test('returns 400 for incorrect current password', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid login credentials'),
    })

    const res = await PATCH(
      createPatchRequest({ newPassword: 'NewPass1!', currentPassword: 'wrong' })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('รหัสผ่านปัจจุบันไม่ถูกต้อง')
  })

  test('returns 200 when updating username only', async () => {
    const updatedProfile = { ...mockProfile, username: 'newusername' }
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockUpdate.mockResolvedValue(updatedProfile)

    const res = await PATCH(createPatchRequest({ username: 'newusername' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.user.username).toBe('newusername')
    expect(body.data.passwordUpdated).toBe(false)
    expect(body.data.emailChangePending).toBe(false)
  })

  test('returns 200 when requesting email update', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockUpdateUser.mockResolvedValue({ data: { user: mockSupabaseUser }, error: null })
    mockFindUnique.mockResolvedValue(mockProfile)

    const res = await PATCH(createPatchRequest({ email: 'newemail@example.com' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.emailChangePending).toBe(true)
  })

  test('email response reports emailChangePending: true', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockUpdateUser.mockResolvedValue({ data: { user: mockSupabaseUser }, error: null })
    mockFindUnique.mockResolvedValue(mockProfile)

    const res = await PATCH(createPatchRequest({ email: 'pending@example.com' }))
    const body = await res.json()

    expect(body.data.emailChangePending).toBe(true)
  })

  test('returns 200 when updating password with valid current password', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockSignInWithPassword.mockResolvedValue({ data: { user: mockSupabaseUser }, error: null })
    mockUpdateUser.mockResolvedValue({ data: { user: mockSupabaseUser }, error: null })
    mockFindUnique.mockResolvedValue(mockProfile)

    const res = await PATCH(
      createPatchRequest({ newPassword: 'NewPass1!', currentPassword: 'OldPass1!' })
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.passwordUpdated).toBe(true)
  })

  test('returns 200 when updating avatarUrl', async () => {
    const updatedProfile = { ...mockProfile, avatarUrl: 'https://example.com/avatar.jpg' }
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockUpdate.mockResolvedValue(updatedProfile)

    const res = await PATCH(
      createPatchRequest({ avatarUrl: 'https://example.com/avatar.jpg' })
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.user.avatarUrl).toBe('https://example.com/avatar.jpg')
  })

  test('returns 200 when setting avatarUrl to null', async () => {
    const updatedProfile = { ...mockProfile, avatarUrl: null }
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockUpdate.mockResolvedValue(updatedProfile)

    const res = await PATCH(
      createPatchRequest({ avatarUrl: null })
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.user.avatarUrl).toBeNull()
  })

  test('password fields are never passed to Prisma', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockSignInWithPassword.mockResolvedValue({ data: { user: mockSupabaseUser }, error: null })
    mockUpdateUser.mockResolvedValue({ data: { user: mockSupabaseUser }, error: null })
    mockFindUnique.mockResolvedValue(mockProfile)

    await PATCH(
      createPatchRequest({
        newPassword: 'NewPass1!',
        currentPassword: 'OldPass1!',
        username: 'newname',
      })
    )

    const updateCall = mockUpdate.mock.calls[0]
    if (updateCall) {
      const data = updateCall[0].data
      expect(data).not.toHaveProperty('currentPassword')
      expect(data).not.toHaveProperty('newPassword')
    }
  })

  test('email is not passed to Prisma before confirmation', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockUpdateUser.mockResolvedValue({ data: { user: mockSupabaseUser }, error: null })
    mockFindUnique.mockResolvedValue(mockProfile)

    await PATCH(createPatchRequest({ email: 'newemail@example.com' }))

    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockFindUnique).toHaveBeenCalled()
  })

  test('unknown request body fields never reach Prisma', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockUpdate.mockResolvedValue(mockProfile)

    await PATCH(
      createPatchRequest({
        username: 'validname',
        role: 'ADMIN',
        someUnknownField: 'value',
      })
    )

    expect(mockUpdate).toHaveBeenCalled()
    const updateCall = mockUpdate.mock.calls[0]
    const data = updateCall[0].data
    expect(data).not.toHaveProperty('role')
    expect(data).not.toHaveProperty('someUnknownField')
    expect(data).toHaveProperty('username')
  })

  test('Prisma update is not called for password-only updates', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockSignInWithPassword.mockResolvedValue({ data: { user: mockSupabaseUser }, error: null })
    mockUpdateUser.mockResolvedValue({ data: { user: mockSupabaseUser }, error: null })
    mockFindUnique.mockResolvedValue(mockProfile)

    await PATCH(
      createPatchRequest({ newPassword: 'NewPass1!', currentPassword: 'OldPass1!' })
    )

    expect(mockUpdate).not.toHaveBeenCalled()
  })

  test('Prisma update is not called for email-only updates', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockUpdateUser.mockResolvedValue({ data: { user: mockSupabaseUser }, error: null })
    mockFindUnique.mockResolvedValue(mockProfile)

    await PATCH(createPatchRequest({ email: 'new@example.com' }))

    expect(mockUpdate).not.toHaveBeenCalled()
  })

  test('updateUser({ password }) is not called when password verification fails', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid login credentials'),
    })

    await PATCH(
      createPatchRequest({ newPassword: 'NewPass1!', currentPassword: 'wrong' })
    )

    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  test('email update is not called after password update fails', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid login credentials'),
    })

    await PATCH(
      createPatchRequest({
        newPassword: 'NewPass1!',
        currentPassword: 'wrong',
        email: 'new@example.com',
      })
    )

    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  test('Prisma update is not called after an earlier Supabase operation fails', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockSignInWithPassword.mockResolvedValue({ data: { user: mockSupabaseUser }, error: null })
    mockUpdateUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Password update failed'),
    })

    await PATCH(
      createPatchRequest({
        newPassword: 'NewPass1!',
        currentPassword: 'OldPass1!',
        username: 'newname',
      })
    )

    expect(mockUpdate).not.toHaveBeenCalled()
  })

  test('sensitive password values are not returned in successful responses', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockSignInWithPassword.mockResolvedValue({ data: { user: mockSupabaseUser }, error: null })
    mockUpdateUser.mockResolvedValue({ data: { user: mockSupabaseUser }, error: null })
    mockFindUnique.mockResolvedValue(mockProfile)

    const res = await PATCH(
      createPatchRequest({ newPassword: 'NewPass1!', currentPassword: 'OldPass1!' })
    )
    const body = await res.json()

    expect(body.data.passwordUpdated).toBe(true)
    expect(body.data.user).not.toHaveProperty('currentPassword')
    expect(body.data.user).not.toHaveProperty('newPassword')
    const allText = JSON.stringify(body)
    expect(allText).not.toContain('NewPass1!')
    expect(allText).not.toContain('OldPass1!')
  })

  test('confirmPassword omitted — backward compatible (200)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockSignInWithPassword.mockResolvedValue({ data: { user: mockSupabaseUser }, error: null })
    mockUpdateUser.mockResolvedValue({ data: { user: mockSupabaseUser }, error: null })
    mockFindUnique.mockResolvedValue(mockProfile)

    const res = await PATCH(
      createPatchRequest({ newPassword: 'NewPass1!', currentPassword: 'OldPass1!' })
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.passwordUpdated).toBe(true)
  })

  test('confirmPassword matches newPassword (200)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockSignInWithPassword.mockResolvedValue({ data: { user: mockSupabaseUser }, error: null })
    mockUpdateUser.mockResolvedValue({ data: { user: mockSupabaseUser }, error: null })
    mockFindUnique.mockResolvedValue(mockProfile)

    const res = await PATCH(
      createPatchRequest({
        newPassword: 'NewPass1!',
        currentPassword: 'OldPass1!',
        confirmPassword: 'NewPass1!',
      })
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.passwordUpdated).toBe(true)
  })

  test('confirmPassword does not match newPassword (400)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })

    const res = await PATCH(
      createPatchRequest({
        newPassword: 'NewPass1!',
        currentPassword: 'OldPass1!',
        confirmPassword: 'Different1!',
      })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toContain('ไม่ตรงกัน')
  })

  test('newPassword equals currentPassword (400)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })

    const res = await PATCH(
      createPatchRequest({ newPassword: 'OldPass1!', currentPassword: 'OldPass1!' })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toContain('ไม่เหมือน')
  })

  test('Supabase updateUser fails for password (400)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockSignInWithPassword.mockResolvedValue({ data: { user: mockSupabaseUser }, error: null })
    mockUpdateUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Password update failed'),
    })

    const res = await PATCH(
      createPatchRequest({ newPassword: 'NewPass1!', currentPassword: 'OldPass1!' })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Failed to update password')
  })

  test('unexpected error returns 500', async () => {
    mockGetUser.mockRejectedValue(new Error('Unexpected crash'))

    const res = await PATCH(createPatchRequest({ username: 'test' }))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Internal Server Error')
  })

  test('existing GET tests continue to pass alongside PATCH', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    })
    mockFindUnique.mockResolvedValue(mockProfile)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.user).toEqual(mockProfile)
  })
})