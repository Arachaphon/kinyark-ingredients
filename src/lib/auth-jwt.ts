import { jwtVerify, createRemoteJWKSet } from 'jose'

const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost'

let jwksInstance: ReturnType<typeof createRemoteJWKSet> | null = null
function getJWKS() {
  if (!jwksInstance) {
    jwksInstance = createRemoteJWKSet(
      new URL(`${getSupabaseUrl()}/auth/v1/.well-known/jwks.json`)
    )
  }
  return jwksInstance
}

/**
 * ฟังก์ชันถอดรหัสและยืนยันความถูกต้องของ Supabase JWT จากหลังบ้านแบบ 100% Local (0ms Network latency)
 */
export async function verifySupabaseJWT(token: string) {
  try {
    const supabaseUrl = getSupabaseUrl()
    const { payload } = await jwtVerify(token, getJWKS(), {
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
