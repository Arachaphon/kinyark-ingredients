import { proxy } from '@/proxy';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { verifySupabaseJWT } from '@/lib/auth-jwt';

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

jest.mock('@/lib/auth-jwt', () => ({
  verifySupabaseJWT: jest.fn(),
}));

jest.mock('next/server', () => {
  const actualNextServer = jest.requireActual('next/server');
  return {
    ...actualNextServer,
    NextResponse: {
      ...actualNextServer.NextResponse,
      next: jest.fn((options) => actualNextServer.NextResponse.next(options)),
      redirect: jest.fn((url, init) => actualNextServer.NextResponse.redirect(url, init)),
    },
  };
});

describe('Proxy Middleware Header Injection', () => {
  let mockGetSession: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetSession = jest.fn();
    (createServerClient as jest.Mock).mockReturnValue({
      auth: {
        getSession: mockGetSession,
      },
    });

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  });

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('strips client-side spoofed x-user-id header when unauthenticated', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const request = new NextRequest('http://localhost:3000/api/recipes', {
      headers: { 'x-user-id': 'spoofed-user-id' },
    });
    await proxy(request);

    expect(NextResponse.next).toHaveBeenCalled();
    const callArgs = (NextResponse.next as jest.Mock).mock.calls[0][0];
    const headers: Headers = callArgs.request.headers;
    expect(headers.get('x-user-id')).toBeNull();
  });

  it('injects verified x-user-id and x-user-role when session access_token is valid', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'valid-token' } },
    });
    (verifySupabaseJWT as jest.Mock).mockResolvedValue({
      userId: 'user-123',
      role: 'user',
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/recipes');
    await proxy(request);

    expect(verifySupabaseJWT).toHaveBeenCalledWith('valid-token');
    expect(NextResponse.next).toHaveBeenCalled();
    const callArgs = (NextResponse.next as jest.Mock).mock.calls[0][0];
    const headers: Headers = callArgs.request.headers;
    expect(headers.get('x-user-id')).toBe('user-123');
    expect(headers.get('x-user-role')).toBe('user');
  });

  it('does not set x-user-id if verifySupabaseJWT returns no userId', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'invalid-token' } },
    });
    (verifySupabaseJWT as jest.Mock).mockResolvedValue({
      userId: null,
      role: null,
      error: 'Invalid or expired token',
    });

    const request = new NextRequest('http://localhost:3000/api/recipes');
    await proxy(request);

    const callArgs = (NextResponse.next as jest.Mock).mock.calls[0][0];
    const headers: Headers = callArgs.request.headers;
    expect(headers.get('x-user-id')).toBeNull();
  });

  it('redirects unauthenticated users attempting to access protected routes to /login', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const request = new NextRequest('http://localhost:3000/my-recipe');
    const res = await proxy(request);

    expect(NextResponse.redirect).toHaveBeenCalled();
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/login');
    expect(res.headers.get('Cache-Control')).toContain('no-store');
  });

  it('allows unauthenticated users to access public routes like /home or /recipe/123', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const request = new NextRequest('http://localhost:3000/home');
    const res = await proxy(request);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(res.headers.get('Cache-Control')).toContain('no-store');
  });
});
