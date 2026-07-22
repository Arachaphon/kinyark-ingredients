import { getProfile, FULL_PROFILE_SELECT, updateProfile } from "@/lib/profile"
import { updateProfileSchema } from "@/lib/validations/auth.schema"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

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

  if (newPassword) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword!,
    })
    if (signInError) {
      return Response.json({ error: "Incorrect current password" }, { status: 400 })
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (updateError) {
      return Response.json({ error: "Failed to update password" }, { status: 400 })
    }
    passwordUpdated = true
  }

  if (email) {
    const { error: emailError } = await supabase.auth.updateUser({ email })
    if (emailError) {
      return Response.json({ error: "Failed to update email" }, { status: 400 })
    }
    emailChangePending = true
  }

  let updatedUser = null
  const profileData: Record<string, string | null> = {}
  if (username !== undefined) profileData.username = username
  if (avatarUrl !== undefined) profileData.avatarUrl = avatarUrl

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
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
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

    const supabaseAdmin = await createClient()
    await supabaseAdmin.auth.admin.deleteUser(user.id)

    return Response.json({ data: { id: user.id } })
  } catch (error) {
    console.error("Error deleting account:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
