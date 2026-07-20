import { getProfile, FULL_PROFILE_SELECT } from "@/lib/profile"
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

  const body = await request.json()

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: body.currentPassword,
  })

  if (signInError) {
    return Response.json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 400 })
  }

  const allowed = ["username", "avatarUrl"]
  const updateData: Record<string, string> = {}

  for (const key of allowed) {
    if (body[key] !== undefined) {
      updateData[key] = body[key]
    }
  }

  if (Object.keys(updateData).length === 0 && !body.newPassword) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 })
  }

  try {
    if (body.newPassword) {
      const { error: updateError } = await supabase.auth.updateUser({
        password: body.newPassword,
      })
      if (updateError) {
        return Response.json({ error: "อัปเดตรหัสผ่านไม่สำเร็จ" }, { status: 400 })
      }
    }

    const select = FULL_PROFILE_SELECT
    const updated = Object.keys(updateData).length > 0
      ? await prisma.user.update({
          where: { id: user.id },
          data: updateData,
          select,
        })
      : await prisma.user.findUnique({
          where: { id: user.id },
          select,
        })

    return Response.json({ data: updated })
  } catch (error) {
    console.error("Error updating profile:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
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
