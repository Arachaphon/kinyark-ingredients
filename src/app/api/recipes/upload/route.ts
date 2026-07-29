import { createClient } from '@/lib/supabase/server'
import {
  validateImageFile,
  validateVideoFile,
  validateImageSignature,
  generateStoragePath,
  uploadAvatar,
  getPublicUrl,
} from '@/lib/storage'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
    }

    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const isVideo = file.type.startsWith('video/')
    if (isVideo) {
      const validation = validateVideoFile(file)
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: validation.status })
      }
    } else {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: validation.status })
      }

      const signatureCheck = await validateImageSignature(file)
      if (!signatureCheck.valid) {
        return NextResponse.json({ error: signatureCheck.error }, { status: signatureCheck.status })
      }
    }

    const path = generateStoragePath(user.id, file.type)
    if (!path) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    // Reuse the avatar upload function since it uploads to the user's folder in the avatars bucket
    const uploadResult = await uploadAvatar(supabase, file, path)
    if (uploadResult.error) {
      console.error('Storage upload error:', uploadResult.error)
      return NextResponse.json({ error: 'Failed to upload image. Please try again' }, { status: 502 })
    }

    const publicUrl = getPublicUrl(supabase, path)
    return NextResponse.json({ url: publicUrl })
  } catch (e) {
    console.error('POST /api/recipes/upload error:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
