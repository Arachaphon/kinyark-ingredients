import { SignJWT } from 'jose'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'super-secret-test-jwt-key-32-chars-long!!'

export interface TestUser {
  id: string
  email: string
  role: 'USER' | 'STORE' | 'ADMIN'
  username?: string
}

/**
 * Generate a signed JWT token for Supabase auth testing
 */
export async function generateTestToken(user: TestUser): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET)
  return new SignJWT({
    sub: user.id,
    email: user.email,
    role: 'authenticated',
    app_metadata: { provider: 'email' },
    user_metadata: { role: user.role, username: user.username },
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret)
}

/**
 * Ensure test user exists in PostgreSQL DB via Prisma
 */
export async function seedTestUser(user: TestUser) {
  return await prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email,
      role: user.role,
      username: user.username,
    },
    create: {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
    },
  })
}

/**
 * Clean up database tables for isolation between integration test suites
 */
export async function cleanupDatabase() {
  try {
    const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT LIKE '_prisma_migrations';
    `

    if (tablenames.length > 0) {
      const formattedTables = tablenames.map((t) => `"public"."${t.tablename}"`).join(', ')
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${formattedTables} CASCADE;`)
    }
  } catch (e) {
    // Ignore error if database tables are temporarily locked or cleared
  }
}

/**
 * Create a Request object with Cookie auth header for testing App Router API routes
 */
export async function createAuthRequest(
  url: string,
  options: RequestInit = {},
  user?: TestUser
): Promise<Request> {
  const headers = new Headers(options.headers || {})

  if (user) {
    const token = await generateTestToken(user)
    headers.set('Authorization', `Bearer ${token}`)
    headers.set('Cookie', `sb-access-token=${token}`)
  }

  return new Request(url, {
    ...options,
    headers,
  })
}
