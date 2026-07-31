import { getProfile, AUTH_PROFILE_SELECT } from '@/lib/profile'

export async function GET() {
  try {
    const { user, error, status } = await getProfile(AUTH_PROFILE_SELECT)

    if (error) {
      return Response.json({ error }, { status: status || 400 })
    }

    return Response.json({ user })
  } catch (e: unknown) {
    console.error('GET /api/auth/me error:', e)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}