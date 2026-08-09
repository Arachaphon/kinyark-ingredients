import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { deleteFileByUrl } from "@/lib/storage"
import { z } from "zod"

const storePostIdParamSchema = z.object({
  id: z.string().uuid("Invalid store post ID"),
})

export const dynamic = "force-dynamic"

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

  const { id: rawId } = await params

  const parsedId = storePostIdParamSchema.safeParse({ id: rawId })
  if (!parsedId.success) {
    return Response.json({ error: "Invalid store post ID" }, { status: 400 })
  }

  const storePostId = parsedId.data.id

  try {
    // 1. Find the store post and verify ownership
    const storePost = await prisma.storePost.findUnique({
      where: { id: storePostId },
      include: {
        images: true,
        videos: true,
      },
    })

    if (!storePost) {
      return Response.json({ error: "Store post not found" }, { status: 404 })
    }

    if (storePost.userId !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    // 2. Collect files to delete from Supabase storage
    const imageUrls = storePost.images.map((img) => img.imageUrl)
    const videoUrls = storePost.videos.map((vid) => vid.videoUrl)

    // 3. Delete DB records
    await prisma.$transaction([
      prisma.storePostImage.deleteMany({ where: { storePostId } }),
      prisma.storePostVideo.deleteMany({ where: { storePostId } }),
      prisma.storePost.delete({ where: { id: storePostId } }),
    ])

    // 4. Clean up storage files
    for (const url of imageUrls) {
      await deleteFileByUrl(supabase, url)
    }

    for (const url of videoUrls) {
      await deleteFileByUrl(supabase, url)
    }

    return Response.json({ data: { success: true, id: storePostId } }, { status: 200 })
  } catch (error) {
    console.error("DELETE /api/store-posts/[id] error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
