import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8, 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร')
  .regex(/[A-Z]/, 'รหัสผ่านต้องมีอักษรตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว')
  .regex(/[a-z]/, 'รหัสผ่านต้องมีอักษรตัวพิมพ์เล็กอย่างน้อย 1 ตัว')
  .regex(/\d/, 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว')
  .regex(/[^a-zA-Z0-9]/, 'รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว')

export const registerSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: passwordSchema,
  username: z
    .string()
    .min(2, 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 2 ตัวอักษร')
    .max(30, 'ชื่อผู้ใช้ยาวเกินไป'),
  role: z.enum(['user', 'shop']).default('user'),
})

export const loginSchema = z.object({
  email: z.string().min(1, 'กรุณากรอกชื่อผู้ใช้หรืออีเมล'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
})

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'กรุณากรอกรหัสผ่านเพื่อยืนยันการลบบัญชี'),
})

export const updateProfileSchema = z
  .object({
    username: z.string().min(2, 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 2 ตัวอักษร').max(30, 'ชื่อผู้ใช้ยาวเกินไป').optional(),
    email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').trim().toLowerCase().optional(),
    avatarUrl: z.union([z.string().url('รูปแบบ URL ไม่ถูกต้อง'), z.literal('')]).nullable().optional(),
    currentPassword: z.string().optional(),
    newPassword: passwordSchema.optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasUpdateField =
      data.username !== undefined ||
      data.email !== undefined ||
      data.avatarUrl !== undefined ||
      data.newPassword !== undefined

    if (!hasUpdateField) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ไม่มีข้อมูลที่จะอัปเดต',
        path: [],
      })
    }

    // กรณีเปลี่ยน Password แล้วไม่กรอก Current Password
    if (data.newPassword && (!data.currentPassword || data.currentPassword.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'กรุณากรอกรหัสผ่านปัจจุบัน',
        path: ['currentPassword'],
      })
    }

    // หมายเหตุ: การเปลี่ยนอีเมลไม่บังคับให้กรอก currentPassword อีกต่อไป
    // ความปลอดภัยของการเปลี่ยนอีเมลจัดการที่ฝั่ง Supabase Auth
    // (ต้องยืนยันผ่านลิงก์ที่ส่งไปอีเมลใหม่/เก่าอยู่แล้ว)

    if (data.confirmPassword && data.newPassword && data.confirmPassword !== data.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน',
        path: ['confirmPassword'],
      })
    }

    if (data.newPassword && data.currentPassword && data.newPassword === data.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านปัจจุบัน',
        path: ['newPassword'],
      })
    }
  })

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>