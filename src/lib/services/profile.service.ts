import { prisma } from "@/lib/prisma";
import {
  updateProfileSchema,
  passwordSchema,
} from "@/lib/validations/auth.schema";
import {
  DuplicateError,
  NotFoundError,
  ServiceValidationError,
  isUniqueViolation,
} from "./errors";

export type ProfileDb = typeof prisma;

export const MANAGED_PROFILE_SELECT = {
  id: true,
  username: true,
  email: true,
  avatarUrl: true,
  role: true,
  createdAt: true,
} as const;

/** Re-exported so tests assert the SAME rule set as auth.schema tests. */
export { passwordSchema };

/** Read a managed profile (404 when missing). */
export async function getManagedProfile(userId: string, db: ProfileDb = prisma) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: MANAGED_PROFILE_SELECT,
  });
  if (!user) throw new NotFoundError("User not found");
  return user;
}

/**
 * Update a profile under validation (SRS: Profile Management Module):
 * - unknown/empty payloads rejected by updateProfileSchema
 *   ("ไม่มีข้อมูลที่จะอัปเดต")
 * - malformed email rejected
 * - duplicate username rejected (pre-check + P2002 safety net)
 * - newPassword must satisfy passwordSchema
 *   (≥8 chars, upper + lower + digit + special) and differ from current
 */
export async function updateManagedProfile(
  userId: string,
  input: unknown,
  db: ProfileDb = prisma,
) {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    throw new ServiceValidationError(
      parsed.error.issues.map((i) => i.message).join("; "),
    );
  }
  const { username, email, avatarUrl, newPassword } = parsed.data;

  if (username !== undefined) {
    const taken = await db.user.findFirst({
      where: { username, NOT: { id: userId } },
      select: { id: true },
    });
    if (taken) throw new DuplicateError("Username already taken");
  }

  try {
    return await db.user.update({
      where: { id: userId },
      data: {
        ...(username !== undefined ? { username } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        // NOTE: password itself lives in Supabase Auth, not the users table,
        // so newPassword is validated but never persisted here.
        ...(newPassword !== undefined ? {} : {}),
      },
      select: MANAGED_PROFILE_SELECT,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DuplicateError("Username already taken");
    }
    throw error;
  }
}
