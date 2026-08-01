import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { deleteFileByUrl } from "@/lib/storage"
import { recipeIdParamSchema } from "@/lib/validations/recipe.schema"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const parsed = recipeIdParamSchema.safeParse({ id })

    if (!parsed.success) {
      return Response.json({ error: "Invalid recipe ID" }, { status: 400 })
    }

    const recipeId = parsed.data.id

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
        recipeIngredients: {
          include: { ingredient: true },
          orderBy: { ingredient: { name: "asc" } },
        },
        equipmentItems: { orderBy: { createdAt: "asc" } },
        images: { orderBy: { createdAt: "asc" } },
        videos: { orderBy: { createdAt: "asc" } },
        reviews: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        storePosts: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
            images: { orderBy: { createdAt: "asc" } },
            videos: { orderBy: { createdAt: "asc" } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!recipe) {
      return Response.json({ error: "Recipe not found" }, { status: 404 })
    }

    // Private recipes are only visible to their owner
    if (recipe.visibility !== "public" && recipe.userId !== user?.id) {
      return Response.json({ error: "Recipe not found" }, { status: 404 })
    }

    const favorite = user
      ? await prisma.favorite.findUnique({
          where: { userId_recipeId: { userId: user.id, recipeId } },
        })
      : null

    return Response.json(
      { data: { ...recipe, isFavorite: favorite !== null } },
      { status: 200 }
    )
  } catch (error) {
    console.error("GET /api/recipes/[id] error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: recipeId } = await params

  if (!recipeId) {
    return Response.json({ error: "Invalid recipe ID" }, { status: 400 })
  }

  try {
    // 1. Check recipe ownership & get image/video URLs
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        images: true,
        videos: true,
      },
    })

    if (!recipe) {
      return Response.json({ error: "Recipe not found" }, { status: 404 })
    }

    if (recipe.userId !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    // 2. Collect image & video URLs before deleting records from DB
    const imageUrls = recipe.images.map((img) => img.imageUrl)
    const videoUrls = recipe.videos.map((vid) => vid.videoUrl)

    // 3. Delete related relations and recipe record from Database
    await prisma.$transaction([
      prisma.reviewLike.deleteMany({ where: { review: { recipeId } } }),
      prisma.review.deleteMany({ where: { recipeId } }),
      prisma.favorite.deleteMany({ where: { recipeId } }),
      prisma.recipeIngredient.deleteMany({ where: { recipeId } }),
      prisma.recipeEquipment.deleteMany({ where: { recipeId } }),
      prisma.recipeImage.deleteMany({ where: { recipeId } }),
      prisma.recipeVideo.deleteMany({ where: { recipeId } }),
      prisma.storePost.deleteMany({ where: { recipeId } }),
      prisma.recipe.delete({ where: { id: recipeId } }),
    ])

    // 4. Delete files from Supabase Storage Bucket
    for (const url of imageUrls) {
      await deleteFileByUrl(supabase, url)
    }

    for (const url of videoUrls) {
      await deleteFileByUrl(supabase, url)
    }

    return Response.json({ data: { success: true, id: recipeId } }, { status: 200 })
  } catch (error) {
    console.error("DELETE /api/recipes/[id] error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

