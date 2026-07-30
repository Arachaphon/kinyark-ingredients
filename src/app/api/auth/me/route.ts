import { getProfile, AUTH_PROFILE_SELECT } from '@/lib/profile';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await getProfile(AUTH_PROFILE_SELECT);

    if (!result || result.error) {
      return NextResponse.json(
        { error: result?.error || 'Unauthorized' },
        { status: result?.status || 401 }
      );
    }

    return NextResponse.json({ user: result.user });
  } catch (e: any) {
    // ป้องกันกรณีที่ Jest เทสแบบ unauthenticated แล้ว getProfile throw exception ออกมา
    return NextResponse.json(
      { error: e?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}