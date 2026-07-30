const mockSupabaseAuth = {
  getUser: jest.fn(),
}
const mockSupabaseStorage = {
  from: jest.fn(() => mockStorageBucket),
}
const mockStorageBucket = {
  upload: jest.fn(),
  remove: jest.fn(),
  getPublicUrl: jest.fn(),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({ auth: mockSupabaseAuth, storage: mockSupabaseStorage })),
}))

const mockPrisma = { user: { findUnique: jest.fn(), update: jest.fn() } }
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { POST } from '@/app/api/users/me/avatar/route'

const mockUserId = '550e8400-e29b-41d4-a716-446655440000'
const mockSupabaseUser = { id: mockUserId, email: 'test@example.com' }

const mockUpdatedProfile = {
  id: mockUserId,
  username: 'testuser',
  email: 'test@example.com',
  avatarUrl: 'https://xxxxx.supabase.co/storage/v1/object/public/avatars/' + mockUserId + '/abc-123.jpg',
  role: 'USER',
  createdAt: '2025-01-15T08:30:00.000Z',
}

function createAvatarRequest(file: File | null): Request {
  const form = new FormData()
  if (file) {
    form.append('avatar', file)
  }
  return new Request('http://localhost/api/users/me/avatar', {
    method: 'POST',
    body: form,
  })
}

function createJpegFile(_size = 1024): File {
  const header = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])
  const body = new Uint8Array(_size - header.length)
  const buffer = new Uint8Array([...header, ...body])
  return new File([buffer], 'test.jpg', { type: 'image/jpeg' })
}

function createPngFile(_size = 1024): File {
  const header = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const body = new Uint8Array(_size - header.length)
  const buffer = new Uint8Array([...header, ...body])
  return new File([buffer], 'test.png', { type: 'image/png' })
}

function createWebpFile(_size = 1024): File {
  const riff = new TextEncoder().encode('RIFF')
  const webp = new TextEncoder().encode('WEBP')
  const body = new Uint8Array(_size - 12)
  const buffer = new Uint8Array([...riff, 0, 0, 0, 0, ...webp, ...body])
  return new File([buffer], 'test.webp', { type: 'image/webp' })
}

function createSvgFile(): File {
  const content = '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
  return new File([content], 'test.svg', { type: 'image/svg+xml' })
}

function createGifFile(_size = 100): File {
  const header = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  const body = new Uint8Array(_size - header.length)
  const buffer = new Uint8Array([...header, ...body])
  return new File([buffer], 'test.gif', { type: 'image/gif' })
}

function createMismatchedFile(): File {
  const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const body = new Uint8Array(100)
  const buffer = new Uint8Array([...pngHeader, ...body])
  return new File([buffer], 'test.jpg', { type: 'image/jpeg' })
}

function createCorruptFile(): File {
  const random = new Uint8Array(100).map(() => Math.floor(Math.random() * 256))
  return new File([random], 'corrupt.jpg', { type: 'image/jpeg' })
}

describe('POST /api/users/me/avatar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: mockSupabaseUser }, error: null })
    mockPrisma.user.findUnique.mockResolvedValue({ avatarUrl: null })
    mockPrisma.user.update.mockResolvedValue(mockUpdatedProfile)
    mockStorageBucket.upload.mockResolvedValue({ data: { path: mockUserId + '/abc-123.jpg' }, error: null })
    mockStorageBucket.getPublicUrl.mockReturnValue({ data: { publicUrl: mockUpdatedProfile.avatarUrl } })
    mockStorageBucket.remove.mockResolvedValue({ data: null, error: null })
  })

  test('returns 401 when not authenticated', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const file = createJpegFile()
    const res = await POST(createAvatarRequest(file))
    const body = await res.json()
    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  test('returns 400 when no file is provided', async () => {
    const res = await POST(createAvatarRequest(null))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error).toBe('No file provided')
  })

  test('returns 400 when file is empty', async () => {
    const emptyFile = new File([], 'empty.jpg', { type: 'image/jpeg' })
    const res = await POST(createAvatarRequest(emptyFile))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error).toContain('empty')
  })

  test('returns 200 with updated profile for valid JPEG', async () => {
    const file = createJpegFile()
    const res = await POST(createAvatarRequest(file))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.user.avatarUrl).toBe(mockUpdatedProfile.avatarUrl)
  })

  test('returns 200 with updated profile for valid PNG', async () => {
    mockStorageBucket.upload.mockResolvedValue({ data: { path: mockUserId + '/abc-456.png' }, error: null })
    mockStorageBucket.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://xxxxx.supabase.co/storage/v1/object/public/avatars/' + mockUserId + '/abc-456.png' } })
    const updated = { ...mockUpdatedProfile, avatarUrl: 'https://xxxxx.supabase.co/storage/v1/object/public/avatars/' + mockUserId + '/abc-456.png' }
    mockPrisma.user.update.mockResolvedValue(updated)

    const file = createPngFile()
    const res = await POST(createAvatarRequest(file))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.user.avatarUrl).toContain('.png')
  })

  test('returns 200 with updated profile for valid WebP', async () => {
    mockStorageBucket.upload.mockResolvedValue({ data: { path: mockUserId + '/abc-789.webp' }, error: null })
    mockStorageBucket.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://xxxxx.supabase.co/storage/v1/object/public/avatars/' + mockUserId + '/abc-789.webp' } })
    const updated = { ...mockUpdatedProfile, avatarUrl: 'https://xxxxx.supabase.co/storage/v1/object/public/avatars/' + mockUserId + '/abc-789.webp' }
    mockPrisma.user.update.mockResolvedValue(updated)

    const file = createWebpFile()
    const res = await POST(createAvatarRequest(file))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.user.avatarUrl).toContain('.webp')
  })

  test('returns 400 for SVG (unsupported MIME type)', async () => {
    const file = createSvgFile()
    const res = await POST(createAvatarRequest(file))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error).toContain('Invalid file type')
  })

  test('returns 400 for GIF (unsupported MIME type)', async () => {
    const file = createGifFile()
    const res = await POST(createAvatarRequest(file))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error).toContain('Invalid file type')
  })

  test('returns 413 for file larger than 5 MB', async () => {
    const file = createJpegFile(6 * 1024 * 1024)
    const res = await POST(createAvatarRequest(file))
    const body = await res.json()
    expect(res.status).toBe(413)
    expect(body.error).toContain('too large')
  })

  test('returns 400 for MIME-extension mismatch (PNG header, JPEG MIME)', async () => {
    const file = createMismatchedFile()
    const res = await POST(createAvatarRequest(file))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error).toContain('does not match')
  })

  test('returns 400 for corrupt image (random bytes with JPEG MIME)', async () => {
    const file = createCorruptFile()
    const res = await POST(createAvatarRequest(file))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error).toContain('does not match')
  })

  test('path uses {userId}/{uuid}.{ext} format and does not contain original filename', async () => {
    const file = createJpegFile()
    await POST(createAvatarRequest(file))
    const callPath = mockStorageBucket.upload.mock.calls[0][0]
    expect(callPath).toMatch(new RegExp('^' + mockUserId + '/[0-9a-f-]+\\.jpg$'))
    expect(callPath).not.toContain('test.jpg')
  })

  test('path is scoped to the authenticated user folder', async () => {
    const file = createJpegFile()
    await POST(createAvatarRequest(file))
    const callPath = mockStorageBucket.upload.mock.calls[0][0]
    expect(callPath.startsWith(mockUserId + '/')).toBe(true)
  })

  test('uploads new file and returns updated profile for first avatar', async () => {
    const file = createJpegFile()
    const res = await POST(createAvatarRequest(file))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.user.avatarUrl).toBeTruthy()
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockUserId },
        data: { avatarUrl: body.data.user.avatarUrl },
      })
    )
  })

  test('replaces existing avatar and deletes old file from Storage', async () => {
    const oldUrl = 'https://xxxxx.supabase.co/storage/v1/object/public/avatars/' + mockUserId + '/old-avatar.jpg'
    mockPrisma.user.findUnique.mockResolvedValue({ avatarUrl: oldUrl })

    const file = createJpegFile()
    const res = await POST(createAvatarRequest(file))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.user.avatarUrl).not.toBe(oldUrl)
    expect(mockStorageBucket.remove).toHaveBeenCalledWith([mockUserId + '/old-avatar.jpg'])
  })

  test('does not delete old file when previous avatar is an external URL', async () => {
    const externalUrl = 'https://external.com/avatar.jpg'
    mockPrisma.user.findUnique.mockResolvedValue({ avatarUrl: externalUrl })

    const file = createJpegFile()
    await POST(createAvatarRequest(file))
    expect(mockStorageBucket.remove).not.toHaveBeenCalled()
  })

  test('does not delete old file when previous avatar belongs to another user', async () => {
    const otherUserUrl = 'https://xxxxx.supabase.co/storage/v1/object/public/avatars/other-user/avatar.jpg'
    mockPrisma.user.findUnique.mockResolvedValue({ avatarUrl: otherUserUrl })

    const file = createJpegFile()
    await POST(createAvatarRequest(file))
    expect(mockStorageBucket.remove).not.toHaveBeenCalled()
  })

  test('returns 502 when Storage upload fails', async () => {
    mockStorageBucket.upload.mockResolvedValue({ data: null, error: new Error('Storage quota exceeded') })

    const file = createJpegFile()
    const res = await POST(createAvatarRequest(file))
    const body = await res.json()
    expect(res.status).toBe(502)
    expect(body.error).toContain('Failed to upload')
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })

  test('removes uploaded object when database update fails (compensation)', async () => {
    mockPrisma.user.update.mockRejectedValue(new Error('DB error'))

    const file = createJpegFile()
    const res = await POST(createAvatarRequest(file))
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body.error).toBe('Internal Server Error')
    expect(mockStorageBucket.remove).toHaveBeenCalled()
  })

  test('old-file deletion failure does not prevent success response', async () => {
    const oldUrl = 'https://xxxxx.supabase.co/storage/v1/object/public/avatars/' + mockUserId + '/old-avatar.jpg'
    mockPrisma.user.findUnique.mockResolvedValue({ avatarUrl: oldUrl })
    mockStorageBucket.remove.mockResolvedValue({ data: null, error: new Error('Network error') })

    const file = createJpegFile()
    const res = await POST(createAvatarRequest(file))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.user.avatarUrl).toBeTruthy()
  })

  test('response does not contain sensitive values', async () => {
    const file = createJpegFile()
    const res = await POST(createAvatarRequest(file))
    const body = await res.json()
    const allText = JSON.stringify(body)
    expect(allText).not.toContain('password')
    expect(allText).not.toContain('token')
    expect(allText).not.toContain('secret')
    expect(allText).not.toContain(mockUserId + '-password')
  })
})
