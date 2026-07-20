import { middleware } from '../src/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

jest.mock('next/server', () => {
  const actualNextServer = jest.requireActual('next/server');
  return {
    ...actualNextServer,
    NextResponse: {
      ...actualNextServer.NextResponse,
      next: jest.fn(() => ({
        cookies: {
          set: jest.fn(),
        },
      })),
      redirect: jest.fn((url) => {
        return {
          status: 307,
          headers: new Map(),
          url: url.toString()
        };
      }),
    },
  };
});

describe('Middleware Route Protection', () => {
  let mockGetUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetUser = jest.fn();
    (createServerClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    });
    
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  });

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('redirects unauthenticated user from protected route (/home) to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest('http://localhost:3000/home');
    await middleware(request);

    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectUrl.pathname).toBe('/login');
  });

  it('redirects unauthenticated user from protected route (/create-recipe) to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest('http://localhost:3000/create-recipe');
    await middleware(request);

    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectUrl.pathname).toBe('/login');
  });

  it('allows authenticated user on protected route (/home)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: '123' } } });

    const request = new NextRequest('http://localhost:3000/home');
    await middleware(request);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('redirects authenticated user away from /login to /home', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: '123' } } });

    const request = new NextRequest('http://localhost:3000/login');
    await middleware(request);

    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectUrl.pathname).toBe('/home');
  });

  it('allows unauthenticated user on /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest('http://localhost:3000/login');
    await middleware(request);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });
  
  it('allows unauthenticated user on root (/)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest('http://localhost:3000/');
    await middleware(request);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });
  
  it('redirects root (/) to /home if authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: '123' } } });

    const request = new NextRequest('http://localhost:3000/');
    await middleware(request);

    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectUrl.pathname).toBe('/home');
  });
});
