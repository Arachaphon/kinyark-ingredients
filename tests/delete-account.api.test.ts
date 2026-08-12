import { DELETE } from '@/app/api/auth/delete-account/route'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Mock Next Request
const createMockRequest = (body: Record<string, unknown>) => {
  return new Request('http://localhost/api/auth/delete-account', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

jest.mock('@supabase/supabase-js', () => {
  const mockAdmin = {
    auth: {
      admin: {
        deleteUser: jest.fn(),
      },
    },
  };
  return {
    createClient: jest.fn(() => mockAdmin),
  };
});

jest.mock('@/lib/supabase/server', () => {
  const mockSupabaseAuth = {
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
  };
  return {
    createClient: jest.fn(() => ({ auth: mockSupabaseAuth })),
  };
});

jest.mock('@/lib/prisma', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue({ email: 'user@example.com', avatarUrl: null }),
      delete: jest.fn(),
    },
    recipeImage: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    recipeVideo: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
  return {
    prisma: mockPrisma,
  };
});

describe('DELETE /api/auth/delete-account', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns 401 if user is not logged in', async () => {
    const supabase = await createClient();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: new Error('Not logged in'),
    })

    const req = createMockRequest({ password: 'Password123!' })
    const res = await DELETE(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.message).toBe('คุณยังไม่ได้เข้าสู่ระบบ')
  })

  test('returns 400 for empty password', async () => {
    const supabase = await createClient();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user123', email: 'test@example.com' } },
      error: null,
    })

    const req = createMockRequest({ password: '' })
    const res = await DELETE(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.message).toBe('ข้อมูลไม่ถูกต้อง')
  })

  test('returns 400 for incorrect password', async () => {
    const supabase = await createClient();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user123', email: 'test@example.com' } },
      error: null,
    });
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid login credentials'),
    })

    const req = createMockRequest({ password: 'WrongPassword!' })
    const res = await DELETE(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.message).toBe('รหัสผ่านไม่ถูกต้อง')
  })

  test('returns 200 and deletes account successfully', async () => {
    const supabase = await createClient();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user123', email: 'test@example.com' } },
      error: null,
    });
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user123' } },
      error: null,
    });

    (prisma.user.delete as jest.Mock).mockResolvedValue({ id: 'user123' })
    
    const supabaseAdmin = createSupabaseClient('', '');
    (supabaseAdmin.auth.admin.deleteUser as jest.Mock).mockResolvedValue({ error: null });
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

    const req = createMockRequest({ password: 'CorrectPassword1!' })
    const res = await DELETE(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.message).toBe('ลบบัญชีสำเร็จ')
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user123' } })
    expect(supabaseAdmin.auth.admin.deleteUser).toHaveBeenCalledWith('user123')
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })

  test('returns 500 if Supabase admin delete fails', async () => {
    const supabase = await createClient();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user123', email: 'test@example.com' } },
      error: null,
    });
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user123' } },
      error: null,
    });

    (prisma.user.delete as jest.Mock).mockResolvedValue({ id: 'user123' })
    
    const supabaseAdmin = createSupabaseClient('', '');
    (supabaseAdmin.auth.admin.deleteUser as jest.Mock).mockResolvedValue({
      error: new Error('Failed to delete in Supabase'),
    });

    const req = createMockRequest({ password: 'CorrectPassword1!' })
    const res = await DELETE(req)
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.message).toBe('เกิดข้อผิดพลาดภายในระบบ')
  })
})
