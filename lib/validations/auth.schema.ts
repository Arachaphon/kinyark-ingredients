import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  username: z.string().min(2, 'ชื่อผู้ใช้ต้องมีอย่างน้อย 2 ตัวอักษร').max(30, 'ชื่อผู้ใช้ยาวเกินไป'),
})

export const loginSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>