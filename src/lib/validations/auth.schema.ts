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

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>