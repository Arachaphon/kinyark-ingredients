const mockAuth = { getUser: jest.fn() }
const mockStorage: { from: jest.Mock } = { from: jest.fn() }
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({ auth: mockAuth, storage: mockStorage })),
}))

const mocks = {
  validateImageFile: jest.fn(),
  validateVideoFile: jest.fn(),
  validateImageSignature: jest.fn(),
  generateStoragePath: jest.fn(),
  uploadFileToBucket: jest.fn(),
  getPublicUrl: jest.fn(),
}
jest.mock('@/lib/storage', () => mocks)

import { POST } from '@/app/api/recipes/upload/route'

const makeRequest = (file: File | null): Request => {
  const fd = new FormData()
  if (file) fd.append('file', file)
  return new Request('http://localhost/api/recipes/upload', {
    method: 'POST',
    body: fd,
  })
}

describe('POST /api/recipes/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockStorage.from = jest.fn()
    mocks.validateImageFile.mockReturnValue({ valid: true })
    mocks.validateVideoFile.mockReturnValue({ valid: true })
    mocks.validateImageSignature.mockResolvedValue({ valid: true })
    mocks.generateStoragePath.mockReturnValue('user-1/abc.jpg')
    mocks.uploadFileToBucket.mockResolvedValue({ data: { path: 'user-1/abc.jpg' }, error: null })
    mocks.getPublicUrl.mockReturnValue('https://pub/recipes/user-1/abc.jpg')
  })

  test('returns 401 when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await POST(makeRequest(null))
    expect(res.status).toBe(401)
  })

  test('returns 400 when no file provided', async () => {
    const res = await POST(makeRequest(null))
    expect(res.status).toBe(400)
  })

  test('returns 400 when file validation fails (invalid image type)', async () => {
    mocks.validateImageFile.mockReturnValue({
      valid: false,
      error: 'Invalid file type',
      status: 400,
    })
    const file = new File(['data'], 'image.txt', { type: 'text/plain' })
    const res = await POST(makeRequest(file))
    expect(res.status).toBe(400)
  })

  test('returns 413 when image too large', async () => {
    mocks.validateImageFile.mockReturnValue({
      valid: false,
      error: 'File too large',
      status: 413,
    })
    const file = new File(['data'], 'big.jpg', { type: 'image/jpeg' })
    const res = await POST(makeRequest(file))
    expect(res.status).toBe(413)
  })

  test('returns 400 when image signature check fails', async () => {
    mocks.validateImageFile.mockReturnValue({ valid: true })
    mocks.validateImageSignature.mockResolvedValue({ valid: false, error: 'mismatch', status: 400 })
    const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' })
    const res = await POST(makeRequest(file))
    expect(res.status).toBe(400)
  })

  test('upload valid image and return public url', async () => {
    mocks.validateImageFile.mockReturnValue({ valid: true })
    mocks.validateImageSignature.mockResolvedValue({ valid: true })
    mocks.uploadFileToBucket.mockResolvedValue({ data: { path: 'user-1/abc.jpg' }, error: null })
    const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' })
    const res = await POST(makeRequest(file))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://pub/recipes/user-1/abc.jpg')
  })

  test('upload valid video and return public url', async () => {
    mocks.validateVideoFile.mockReturnValue({ valid: true })
    const file = new File(['data'], 'vid.mp4', { type: 'video/mp4' })
    const res = await POST(makeRequest(file))
    expect(res.status).toBe(200)
  })

  test('returns 502 when storage upload fails', async () => {
    mocks.validateImageFile.mockReturnValue({ valid: true })
    mocks.validateImageSignature.mockResolvedValue({ valid: true })
    mocks.uploadFileToBucket.mockResolvedValue({ data: null, error: 'bucket missing' })
    const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' })
    const res = await POST(makeRequest(file))
    expect(res.status).toBe(502)
  })

  test('returns 400 for unsupported file type (no storage path)', async () => {
    mocks.validateImageFile.mockReturnValue({ valid: true })
    mocks.validateImageSignature.mockResolvedValue({ valid: true })
    mocks.generateStoragePath.mockReturnValue(null)
    const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' })
    const res = await POST(makeRequest(file))
    expect(res.status).toBe(400)
  })
})