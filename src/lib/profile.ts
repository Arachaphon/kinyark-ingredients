import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { headers } from 'next/headers';
import { cache } from '@/lib/cache';
import { createClient } from '@/lib/supabase/server';

const TTL_PROFILE = 30_000 // 30 seconds cache for user profile

export async function getProfile(select: Prisma.UserSelect) {
  let userId: string | null = null
  try {
    const headerStore = await headers();
    userId = headerStore.get('x-user-id');
  } catch {
    userId = null
  }

  if (!userId) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  if (!userId) {
    return { user: null, error: 'Unauthorized' as const, status: 401 as const };
  }

  const cacheKey = `user:profile:${userId}`
  if (process.env.NODE_ENV !== 'test') {
    const cachedUser = cache.get(cacheKey)
    if (cachedUser) {
      return { user: cachedUser, error: null as null, status: 200 as const }
    }
  }

  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select,
  });

  if (!profile) {
    return { user: null, error: 'Not found' as const, status: 404 as const };
  }

  cache.set(cacheKey, profile, TTL_PROFILE)
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
    cache.del(`user:profile:${userId}`)
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
