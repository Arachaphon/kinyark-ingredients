/**
 * Profile Management Module (SRS: ระบบจัดการโปรไฟล์)
 * Covers: duplicate username rejection, email format, password-change rules
 * (same passwordSchema as auth.schema: upper/lower/number/special + ≥8).
 *
 * Implementation: src/lib/services/profile.service.ts (mocked Prisma).
 */

import {
  updateManagedProfile,
  getManagedProfile,
} from "@/lib/services/profile.service";
import {
  DuplicateError,
  NotFoundError,
  ServiceValidationError,
} from "@/lib/services/errors";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  },
}));

type MockDb = Record<string, Record<string, jest.Mock>>;
const mockDb = prisma as unknown as MockDb;
const USER = "123e4567-e89b-42d3-a456-426614174002";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Profile Management — validation", () => {
  test("username ซ้ำกับผู้ใช้อื่นต้อง reject", async () => {
    mockDb.user.findFirst.mockResolvedValue({ id: "other-user" });

    await expect(
      updateManagedProfile(USER, { username: "taken" }),
    ).rejects.toBeInstanceOf(DuplicateError);
    expect(mockDb.user.update).not.toHaveBeenCalled();
  });

  test("email ผิด format ต้อง reject", async () => {
    await expect(
      updateManagedProfile(USER, { email: "not-an-email" }),
    ).rejects.toBeInstanceOf(ServiceValidationError);
    expect(mockDb.user.update).not.toHaveBeenCalled();
  });

  test("รหัสผ่านใหม่ไม่มีตัวพิมพ์ใหญ่ต้อง reject (กฎเดียวกับ auth.schema)", async () => {
    await expect(
      updateManagedProfile(USER, {
        currentPassword: "OldPass1!",
        newPassword: "weakpass1!",
        confirmPassword: "weakpass1!",
      }),
    ).rejects.toBeInstanceOf(ServiceValidationError);
  });

  test("รหัสผ่านใหม่ไม่มีอักขระพิเศษต้อง reject", async () => {
    await expect(
      updateManagedProfile(USER, {
        currentPassword: "OldPass1!",
        newPassword: "Weakpass1",
        confirmPassword: "Weakpass1",
      }),
    ).rejects.toBeInstanceOf(ServiceValidationError);
  });

  test("payload ว่าง (ไม่มี field ที่อัปเดต) ต้อง reject", async () => {
    await expect(updateManagedProfile(USER, {})).rejects.toBeInstanceOf(
      ServiceValidationError,
    );
  });
});

describe("Profile Management — happy path", () => {
  test("อัปเดต username/email ที่ถูกต้องต้องสำเร็จ", async () => {
    mockDb.user.findFirst.mockResolvedValue(null);
    const updated = { id: USER, username: "newname", email: "a@b.co" };
    mockDb.user.update.mockResolvedValue(updated);

    await expect(
      updateManagedProfile(USER, { username: "newname", email: "a@b.co" }),
    ).resolves.toEqual(updated);
  });

  test("โปรไฟล์ที่ไม่มีอยู่จริง → NotFoundError", async () => {
    mockDb.user.findUnique.mockResolvedValue(null);

    await expect(getManagedProfile(USER)).rejects.toBeInstanceOf(NotFoundError);
  });
});
