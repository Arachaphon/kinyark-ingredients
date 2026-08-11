import { jwtVerify, createRemoteJWKSet } from 'jose'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined in environment variables.')
}

// โหลดและแคช Public Keys จากระบบ JWKS ของ Supabase สำหรับตรวจสอบลายเซ็น ES256 (0ms Latency หลังโหลดครั้งแรก)
const JWKS = createRemoteJWKSet(
  new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`)
)

/**
 * ฟังก์ชันถอดรหัสและยืนยันความถูกต้องของ Supabase JWT จากหลังบ้านแบบ 100% Local (0ms Network latency)
 */
export async function verifySupabaseJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${supabaseUrl}/auth/v1`,
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
