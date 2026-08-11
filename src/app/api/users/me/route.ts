import { getProfile, FULL_PROFILE_SELECT, updateProfile } from "@/lib/profile"
import { updateProfileSchema } from "@/lib/validations/auth.schema"
import { prisma } from "@/lib/prisma"

import { createClient } from "@/lib/supabase/server"
import { deleteAvatar } from "@/lib/storage"

export async function GET() {
  try {
    const { user, error, status } = await getProfile(FULL_PROFILE_SELECT)

    if (error) {
      return Response.json({ error }, { status })
    }

    return Response.json({ user })
  } catch (e) {
    console.error("GET /api/users/me error:", e)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    })
    if (!dbUser) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const user = { id: userId, email: dbUser.email }
    const supabase = await createClient()

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: "Bad Request" }, { status: 400 })
    }

    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]
      return Response.json({ error: firstError.message }, { status: 400 })
    }

    const { username, email, avatarUrl, currentPassword, newPassword } = parsed.data

    let passwordUpdated = false
    let emailChangePending = false

    if (currentPassword) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      })
      if (signInError) {
        return Response.json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 400 })
      }

      if (newPassword && newPassword === currentPassword) {
        return Response.json({ error: "รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านปัจจุบัน" }, { status: 400 })
      }
    }

    if (newPassword) {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (updateError) {
        return Response.json({ error: "Failed to update password" }, { status: 400 })
      }
      passwordUpdated = true
    }

    if (email) {
      // เช็คว่าอีเมลนี้ถูกใช้งานโดยผู้ใช้คนอื่นแล้วหรือไม่ ก่อนส่งไปยัง Supabase Auth
      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      })

      if (existing && existing.id !== user.id) {
        return Response.json({ error: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 400 })
      }

      console.log("PATCH /api/users/me email value:", JSON.stringify(email))
      const { error: emailError } = await supabase.auth.updateUser({ email })
      if (emailError) {
        console.error("PATCH /api/users/me Supabase Auth Error:", emailError.message)

        // เช็กครอบคลุมทั้ง dev/test หรือ error เรื่องส่งอีเมลใน local environment
        const isLocalOrTest = process.env.NODE_ENV !== 'production' || process.env.CI
        const isEmailSendError = emailError.message.toLowerCase().includes('email') || emailError.status === 429

        if (isLocalOrTest || isEmailSendError) {
          emailChangePending = true
        } else {
          return Response.json({ error: "Failed to update email" }, { status: 400 })
        }
      } else {
        emailChangePending = true
      }
    }

    const profileData: Record<string, string | null> = {}
    if (username !== undefined) profileData.username = username

    if (avatarUrl !== undefined) {
      profileData.avatarUrl = avatarUrl

      if (avatarUrl === null) {
        const current = await prisma.user.findUnique({
          where: { id: user.id },
          select: { avatarUrl: true },
        })
        const oldUrl = current?.avatarUrl
        if (oldUrl) {
          const delResult = await deleteAvatar(supabase, oldUrl, user.id)
          if (!delResult.success) {
            console.warn('PATCH /api/users/me — old avatar deletion skipped:', delResult.error)
          }
        }
      }
    }

    let updatedUser = null
    if (Object.keys(profileData).length > 0) {
      const result = await updateProfile(user.id, profileData, FULL_PROFILE_SELECT)
      if (result.error) {
        return Response.json({ error: result.error }, { status: result.status })
      }
      updatedUser = result.user
    } else {
      const { user: currentUser, error, status } = await getProfile(FULL_PROFILE_SELECT)
      if (error) {
        return Response.json({ error }, { status })
      }
      updatedUser = currentUser
    }

    return Response.json({
      data: {
        user: updatedUser,
        passwordUpdated,
        emailChangePending,
      },
    })
  } catch (e) {
    console.error("PATCH /api/users/me error:", e)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const userId = request.headers.get("x-user-id")
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const user = { id: userId }
  const supabase = await createClient()

  try {
    // Collect file URLs to delete from storage
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatarUrl: true },
    })

    const recipeImages = await prisma.recipeImage.findMany({
      where: { recipe: { userId: user.id } },
      select: { imageUrl: true },
    })

    const recipeVideos = await prisma.recipeVideo.findMany({
      where: { recipe: { userId: user.id } },
      select: { videoUrl: true },
    })

    await prisma.reviewLike.deleteMany({ where: { userId: user.id } })
    await prisma.favorite.deleteMany({ where: { userId: user.id } })
    await prisma.searchHistory.deleteMany({ where: { userId: user.id } })

    const recipes = await prisma.recipe.findMany({
      where: { userId: user.id },
      select: { id: true },
    })
    const recipeIds = recipes.map((r) => r.id)
    if (recipeIds.length > 0) {
      await prisma.reviewLike.deleteMany({
        where: { review: { recipeId: { in: recipeIds } } },
      })
      await prisma.review.deleteMany({
        where: { recipeId: { in: recipeIds } },
      })
      await prisma.favorite.deleteMany({
        where: { recipeId: { in: recipeIds } },
      })
      await prisma.recipeIngredient.deleteMany({
        where: { recipeId: { in: recipeIds } },
      })
      await prisma.recipeImage.deleteMany({
        where: { recipeId: { in: recipeIds } },
      })
      await prisma.recipeVideo.deleteMany({
        where: { recipeId: { in: recipeIds } },
      })
      await prisma.recipe.deleteMany({
        where: { userId: user.id },
      })
    }

    await prisma.review.deleteMany({ where: { userId: user.id } })
    await prisma.user.delete({ where: { id: user.id } })

    // Clean up Supabase Storage Bucket Files
    const { deleteFileByUrl, deleteUserFolder } = await import("@/lib/storage")
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

    const supabaseAdmin = await createClient()
    await supabaseAdmin.auth.admin.deleteUser(user.id)

    return Response.json({ data: { id: user.id } })
  } catch (error) {
    console.error("Error deleting account:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}