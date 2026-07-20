import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let errorRedirect = searchParams.get('error_description')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      errorRedirect = error.message
    }
  }

  if (errorRedirect) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorRedirect)}`)
  }

  return NextResponse.redirect(`${origin}/home`)
}