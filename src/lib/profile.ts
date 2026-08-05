import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export async function getProfile(select: Prisma.UserSelect) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, error: 'Unauthorized' as const, status: 401 as const };
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select,
  });

  if (!profile) {
    return { user: null, error: 'Not found' as const, status: 404 as const };
  }

  return { user: profile, error: null as null, status: 200 as const };
}

export type ProfileUpdateData = {
  username?: string
  avatarUrl?: string | null
}

export async function updateProfile(
  userId: string,
  data: ProfileUpdateData,
  select: Prisma.UserSelect,
) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select,
    })
    return { user, error: null as null, status: 200 as const }
  } catch (e) {
    console.error('Error updating profile:', e)
    return { user: null, error: 'Internal Server Error' as const, status: 500 as const }
  }
}

export const AUTH_PROFILE_SELECT = {
  id: true, username: true, email: true, avatarUrl: true, role: true,
} as const satisfies Prisma.UserSelect;

export const FULL_PROFILE_SELECT = {
  id: true, username: true, email: true, avatarUrl: true,
  role: true, createdAt: true,
} as const satisfies Prisma.UserSelect;
