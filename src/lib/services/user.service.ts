import { prisma } from "@/lib/prisma";
import {
  DuplicateError,
  NotFoundError,
  isRecordNotFound,
  isUniqueViolation,
} from "./errors";

export type UserDb = typeof prisma;

export const USER_PUBLIC_SELECT = {
  id: true,
  username: true,
  email: true,
  avatarUrl: true,
  role: true,
  createdAt: true,
} as const;

export interface UserProfileUpdate {
  username?: string;
  avatarUrl?: string | null;
}

/** Get a user profile by id (404 when missing). */
export async function getUserProfile(userId: string, db: UserDb = prisma) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: USER_PUBLIC_SELECT,
  });
  if (!user) throw new NotFoundError("User not found");
  return user;
}

/**
 * Update username / avatar. A taken username surfaces as DuplicateError
 * (Prisma P2002 on users.username).
 */
export async function updateUserProfile(
  userId: string,
  data: UserProfileUpdate,
  db: UserDb = prisma,
) {
  try {
    return await db.user.update({
      where: { id: userId },
      data,
      select: USER_PUBLIC_SELECT,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DuplicateError("Username already taken");
    }
    if (isRecordNotFound(error)) throw new NotFoundError("User not found");
    throw error;
  }
}

/**
 * Delete a user account.
 * All owned rows (recipes, reviews, favorites, search history,
 * review likes, store posts) are removed by the database via
 * onDelete: Cascade declared in schema.prisma — same call as
 * DELETE /api/auth/delete-account.
 */
export async function deleteUserAccount(userId: string, db: UserDb = prisma) {
  try {
    return await db.user.delete({ where: { id: userId } });
  } catch (error) {
    if (isRecordNotFound(error)) throw new NotFoundError("User not found");
    throw error;
  }
}
