import { getProfile, AUTH_PROFILE_SELECT } from '@/lib/profile';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { user, error, status } = await getProfile(AUTH_PROFILE_SELECT);

    if (error) {
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ user });
  } catch (e) {
    console.error('GET /api/auth/me error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
