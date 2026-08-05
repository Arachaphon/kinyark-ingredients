import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { deleteAccountSchema } from '@/lib/validations/auth.schema'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { message: 'คุณยังไม่ได้เข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedFields = deleteAccountSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        { message: 'ข้อมูลไม่ถูกต้อง', errors: validatedFields.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { password } = validatedFields.data

    // Verify password first by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password,
    })

    if (signInError) {
      return NextResponse.json(
        { message: 'รหัสผ่านไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // 1. Fetch user avatar & recipes media files before deletion
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatarUrl: true }
    })

    const recipeImages = await prisma.recipeImage.findMany({
      where: { recipe: { userId: user.id } },
      select: { imageUrl: true }
    })

    const recipeVideos = await prisma.recipeVideo.findMany({
      where: { recipe: { userId: user.id } },
      select: { videoUrl: true }
    })

    // Delete from Prisma DB
    await prisma.user.delete({
      where: { id: user.id },
    })

    // Delete files from Supabase Storage (User folder & individual URLs)
    const { deleteFileByUrl, deleteUserFolder } = await import('@/lib/storage')
    if (userData?.avatarUrl) {
      await deleteFileByUrl(supabase, userData.avatarUrl)
    }

    for (const img of recipeImages) {
      await deleteFileByUrl(supabase, img.imageUrl)
    }

    for (const vid of recipeVideos) {
      await deleteFileByUrl(supabase, vid.videoUrl)
    }

    await deleteUserFolder(supabase, user.id, 'avatars')
    await deleteUserFolder(supabase, user.id, 'recipes')

    // Delete from Supabase Auth using Service Role Key
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      throw new Error(`Supabase delete user failed: ${deleteError.message}`)
    }

    // Sign out to clear cookies/session
    await supabase.auth.signOut()

    return NextResponse.json({ message: 'ลบบัญชีสำเร็จ' }, { status: 200 })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดภายในระบบ' },
      { status: 500 }
    )
  }
}
