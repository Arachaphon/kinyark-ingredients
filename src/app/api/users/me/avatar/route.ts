import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { FULL_PROFILE_SELECT } from '@/lib/profile'
import {
  validateImageFile,
  validateImageSignature,
  generateStoragePath,
  uploadAvatar,
  deleteAvatar,
  getPublicUrl,
} from '@/lib/storage'

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = { id: userId }
    const supabase = await createClient()

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return Response.json({ error: 'Bad Request' }, { status: 400 })
    }

    const file = formData.get('avatar') as File | null
    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const validation = validateImageFile(file)
    if (!validation.valid) {
      return Response.json({ error: validation.error }, { status: validation.status })
    }

    const signatureCheck = await validateImageSignature(file)
    if (!signatureCheck.valid) {
      return Response.json({ error: signatureCheck.error }, { status: signatureCheck.status })
    }

    const path = generateStoragePath(user.id, file.type)
    if (!path) {
      return Response.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatarUrl: true },
    })
    const previousAvatarUrl = currentProfile?.avatarUrl ?? null

    const uploadResult = await uploadAvatar(supabase, file, path)
    if (uploadResult.error) {
      console.error('Storage upload error:', uploadResult.error)
      return Response.json({ error: 'Failed to upload image. Please try again' }, { status: 502 })
    }

    const publicUrl = getPublicUrl(supabase, path)

    let updatedUser
    try {
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: publicUrl },
        select: FULL_PROFILE_SELECT,
      })
    } catch (e) {
      console.error('Database update failed after upload — removing uploaded object:', e)
      await supabase.storage.from('avatars').remove([path]).catch((cleanupErr) => {
        console.error('Failed to clean up orphaned avatar:', cleanupErr)
      })
      return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }

    if (previousAvatarUrl) {
      const deleteResult = await deleteAvatar(supabase, previousAvatarUrl, user.id)
      if (!deleteResult.success) {
        console.warn('Old avatar deletion non-fatal:', deleteResult.error)
      }
    }

    return Response.json({ data: { user: updatedUser } })
  } catch (e) {
    console.error('POST /api/users/me/avatar error:', e)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
