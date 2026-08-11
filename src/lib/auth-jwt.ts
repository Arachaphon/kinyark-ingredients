import { jwtVerify } from 'jose'

/**
 * ฟังก์ชันถอดรหัสและยืนยันความถูกต้องของ Supabase JWT จากหลังบ้านแบบ 100% Local (0ms Network latency)
 */
export async function verifySupabaseJWT(token: string) {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET
  if (!jwtSecret) {
    throw new Error('SUPABASE_JWT_SECRET is not defined in environment variables.')
  }

  try {
    const secret = new TextEncoder().encode(jwtSecret)
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    })
    
    // คืนค่ารูปแบบสิทธิ์รวมถึง userId (sub)
    return {
      userId: payload.sub as string,
      email: payload.email as string,
      role: (payload.role as string) || 'authenticated',
      error: null,
    }
  } catch (error) {
    console.error('Local JWT verification error:', error)
    return {
      userId: null,
      email: null,
      role: null,
      error: 'Invalid or expired token',
    }
  }
}
