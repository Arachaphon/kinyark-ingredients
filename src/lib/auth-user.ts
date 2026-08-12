import { createClient } from '@/lib/supabase/server'

export async function getAuthUserId(request?: Request): Promise<string | null> {
  const headerUserId = request?.headers.get('x-user-id')
  if (headerUserId) return headerUserId

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}
