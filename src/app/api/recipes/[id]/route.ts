import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { upsertRecipeIngredients } from "@/lib/ingredients"
import { recipeIdParamSchema, updateRecipeSchema } from "@/lib/validations/recipe.schema"
import { cache, TTL_RECIPE } from "@/lib/cache"
import { createClient } from "@/lib/supabase/server"
import { deleteFileByUrl } from "@/lib/storage"
import { getAuthUserId } from "@/lib/auth-user"

class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await props.params
    const id = params?.id

    const parsed = recipeIdParamSchema.safeParse({ id })

    if (!parsed.success) {
      return Response.json({ error: "Invalid recipe ID" }, { status: 400 })
    }

    const recipeId = parsed.data.id

    const userId = await getAuthUserId(_request)
    const userRole = _request.headers.get("x-user-role")
    const user = userId ? { id: userId, role: userRole } : null

    const cacheKey = `recipe:${recipeId}`

    // Reviews are NEVER cached — always fetched fresh per request so that
    // newly created/edited/deleted reviews show up immediately.
    const fetchFreshReviews = () =>
      prisma.review.findMany({
        where: { recipeId },
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
      })

    let cachedBase: Record<string, unknown> | undefined
    if (process.env.NODE_ENV !== 'test') {
      cachedBase = cache.get<Record<string, unknown>>(cacheKey)
    }

    let base: Record<string, unknown>
    if (cachedBase) {
      base = cachedBase
    } else {
      const [recipe, recipeIngredients, equipmentItems, images, videos, storePosts] =
        await Promise.all([
          prisma.recipe.findUnique({
            where: { id: recipeId },
            include: {
              user: { select: { id: true, username: true, avatarUrl: true } },
            },
          }),
          prisma.recipeIngredient.findMany({
            where: { recipeId },
            include: { ingredient: { include: { category: true } } },
            orderBy: { ingredient: { name: "asc" } },
          }),
          prisma.recipeEquipment.findMany({
            where: { recipeId },
            orderBy: { createdAt: "asc" },
          }),
          prisma.recipeImage.findMany({
            where: { recipeId },
            orderBy: { createdAt: "asc" },
          }),
          prisma.recipeVideo.findMany({
            where: { recipeId },
            orderBy: { createdAt: "asc" },
          }),
          prisma.storePost.findMany({
            where: { recipeId },
            include: {
              user: { select: { id: true, username: true, avatarUrl: true } },
              images: { orderBy: { createdAt: "asc" } },
              videos: { orderBy: { createdAt: "asc" } },
            },
            orderBy: { createdAt: "desc" },
          }),
        ])

      if (!recipe) {
        return Response.json({ error: "Recipe not found" }, { status: 404 })
      }

      const fullRecipe = {
        ...recipe,
        recipeIngredients,
        equipmentItems,
        images,
        videos,
        storePosts,
      }

      const isStorePostOwner = user
         ? storePosts.some((sp) => sp.userId === user.id)
         : false

      if ((recipe.visibility === "private" || recipe.visibility === "draft") &&
          recipe.userId !== user?.id && !isStorePostOwner) {
        return Response.json({ error: "Recipe not found" }, { status: 404 })
      }

      if (recipe.visibility === "protected" && user && recipe.userId !== user.id && !isStorePostOwner) {
        if (user.role === "STORE") {
          return Response.json({ error: "Recipe not found" }, { status: 404 })
        }
      }

      base = fullRecipe

      // Cache the recipe body (without reviews/isFavorite) — shared across all users
      if (process.env.NODE_ENV !== 'test') {
        cache.set(cacheKey, base, TTL_RECIPE)
      }
    }

    const reviews = await fetchFreshReviews()

    const ratingBreakdown = {
      "5": 0,
      "4": 0,
      "3": 0,
      "2": 0,
      "1": 0,
    }
    reviews.forEach((rev) => {
      if (rev.rating >= 1 && rev.rating <= 5) {
        ratingBreakdown[rev.rating.toString() as keyof typeof ratingBreakdown]++
      }
    })

    const isFavorite = user
      ? !!(await prisma.favorite.findUnique({
          where: { userId_recipeId: { userId: user.id, recipeId } },
        }))
      : false

    return Response.json(
      { data: { ...base, reviews, ratingBreakdown, isFavorite } },
      { status: 200 }
    )
  } catch (error) {
    console.error("GET /api/recipes/[id] error:", error)
    return Response.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  const userId = await getAuthUserId(request)

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = { id: userId }
  let supabase = null
  try {
    supabase = await createClient()
  } catch {
    // cookies() unavailable in test context
  }

  const params = await props.params
  const rawId = params?.id

  const parsedId = recipeIdParamSchema.safeParse({ id: rawId })
  if (!parsedId.success) {
    return Response.json({ error: "Invalid recipe ID" }, { status: 400 })
  }

  const recipeId = parsedId.data.id

  try {
    // 1. Check recipe ownership & get image/video URLs
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        images: true,
        videos: true,
        storePosts: {
          include: { images: true, videos: true },
        },
      },
    })

    if (!recipe) {
      return Response.json({ error: "Recipe not found" }, { status: 404 })
    }

    if (recipe.userId !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    // 2. Collect image & video URLs (recipe + store posts) before deleting records from DB
    const imageUrls = recipe.images.map((img) => img.imageUrl)
    const videoUrls = recipe.videos.map((vid) => vid.videoUrl)
    const storeImageUrls = recipe.storePosts.flatMap((sp) => sp.images.map((img) => img.imageUrl))
    const storeVideoUrls = recipe.storePosts.flatMap((sp) => sp.videos.map((vid) => vid.videoUrl))

    // 3. Delete related relations and recipe record from Database
    await prisma.$transaction(
      async (tx) => {
        await tx.storePostImage.deleteMany({ where: { storePost: { recipeId } } })
        await tx.storePostVideo.deleteMany({ where: { storePost: { recipeId } } })
        await tx.storePost.deleteMany({ where: { recipeId } })
        await tx.reviewLike.deleteMany({ where: { review: { recipeId } } })
        await tx.review.deleteMany({ where: { recipeId } })
        await tx.favorite.deleteMany({ where: { recipeId } })
        await tx.recipeIngredient.deleteMany({ where: { recipeId } })
        await tx.recipeEquipment.deleteMany({ where: { recipeId } })
        await tx.recipeImage.deleteMany({ where: { recipeId } })
        await tx.recipeVideo.deleteMany({ where: { recipeId } })
        await tx.recipe.delete({ where: { id: recipeId } })
      },
      {
        maxWait: 15000,
        timeout: 30000,
      }
    )

    // 4. Delete files from Supabase Storage Bucket
    for (const url of [...imageUrls, ...storeImageUrls]) {
      await deleteFileByUrl(supabase, url)
    }

    for (const url of [...videoUrls, ...storeVideoUrls]) {
      await deleteFileByUrl(supabase, url)
    }

    cache.del(`recipe:${recipeId}`)
    cache.delPrefix(`recipe:${recipeId}:`)
    return Response.json({ data: { success: true, id: recipeId } }, { status: 200 })
  } catch (error) {
    console.error("DELETE /api/recipes/[id] error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const user = { id: userId }

    const params = await props.params
    const id = params?.id
    const parsedId = recipeIdParamSchema.safeParse({ id })

    if (!parsedId.success) {
      return Response.json({ error: "Invalid recipe ID" }, { status: 400 })
    }

    const recipeId = parsedId.data.id

    // Check if recipe exists and user is owner (recipe or its store posts)
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { storePosts: { select: { userId: true } } },
    })

    if (!existingRecipe) {
      return Response.json({ error: "Recipe not found" }, { status: 404 })
    }

    const isRecipeOwner = existingRecipe.userId === user.id
    const isStorePostOwner = existingRecipe.storePosts.some((sp) => sp.userId === user.id)
    if (!isRecipeOwner && !isStorePostOwner) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const result = updateRecipeSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues.map((issue) => issue.message).join("; ") },
        { status: 400 }
      )
    }

    const {
      recipeName,
      description,
      instructions,
      ingredients,
      equipmentItems,
      featuredImageUrl,
      images,
      videos,
      bgColor,
      aiProvider,
      visibility,
      referenceRecipeId,
      store
    } = result.data

    // Store post owners who do NOT own the recipe may only update their store post
    if (!isRecipeOwner && isStorePostOwner) {
      const hasContentFields =
        recipeName !== undefined ||
        description !== undefined ||
        instructions !== undefined ||
        ingredients !== undefined ||
        equipmentItems !== undefined ||
        featuredImageUrl !== undefined ||
        images !== undefined ||
        videos !== undefined ||
        bgColor !== undefined ||
        aiProvider !== undefined ||
        visibility !== undefined ||
        referenceRecipeId !== undefined
      if (hasContentFields) {
        return Response.json(
          { error: "Forbidden: you can only edit your store post fields" },
          { status: 403 }
        )
      }
    }

    // 1. Process images and videos
    let uniqueImageUrls: string[] | undefined;
    if (featuredImageUrl !== undefined || images !== undefined) {
      const allImageUrls = [
        ...(featuredImageUrl ? [featuredImageUrl] : []),
        ...(images || [])
      ].filter((url): url is string => !!url)
      uniqueImageUrls = Array.from(new Set(allImageUrls))
    }

    const hasContentChanges =
      recipeName !== undefined ||
      description !== undefined ||
      instructions !== undefined ||
      ingredients !== undefined ||
      equipmentItems !== undefined ||
      bgColor !== undefined ||
      aiProvider !== undefined ||
      visibility !== undefined ||
      referenceRecipeId !== undefined ||
      uniqueImageUrls !== undefined ||
      videos !== undefined

    const updatedRecipe = await prisma.$transaction(async (tx) => {
      // Upsert ingredients if provided
      let recipeIngredientsToCreate;
      if (ingredients) {
        // Delete old ingredients
        await tx.recipeIngredient.deleteMany({ where: { recipeId } })
        
        const savedIngredients = await upsertRecipeIngredients(tx, ingredients)

        recipeIngredientsToCreate = savedIngredients.map((savedIngredient, index) => {
          const requestedIngredient = ingredients[index];
          return {
            ingredientId: savedIngredient.id,
            quantity: requestedIngredient.quantity,
            unit: requestedIngredient.unit,
          };
        });
      }

      // Handle equipments
      if (equipmentItems) {
        await tx.recipeEquipment.deleteMany({ where: { recipeId } })
      }

      // Handle images
      if (uniqueImageUrls) {
        await tx.recipeImage.deleteMany({ where: { recipeId } })
      }

      // Handle videos
      if (videos) {
        await tx.recipeVideo.deleteMany({ where: { recipeId } })
      }

      // Handle store post (create if not exists, otherwise update)
      if (store) {
        // Allow switching the base recipe this store post is linked to
        let effectiveRecipeId = recipeId
        if (store.recipeId && store.recipeId !== recipeId) {
          const targetRecipe = await tx.recipe.findUnique({
            where: { id: store.recipeId },
            select: { id: true, visibility: true, userId: true },
          })
          if (!targetRecipe) {
            throw new HttpError(404, "Target recipe not found")
          }
          const targetIsUsable =
            targetRecipe.visibility === "public" ||
            targetRecipe.userId === user.id
          if (!targetIsUsable) {
            throw new HttpError(400, "Cannot link the store post to this recipe")
          }
          effectiveRecipeId = store.recipeId
        }

        const existingStorePost = await tx.storePost.findFirst({
          where: { recipeId, userId: user.id },
        })

        const commonFields = {
          storeName: store.storeName,
          sellingPrice: store.sellingPrice,
          storeDescription: store.storeDescription ?? null,
          storeLocation: store.storeLocation ?? null,
          contactInfo: store.contactInfo ?? null,
          visibility: store.visibility ?? visibility ?? existingStorePost?.visibility ?? "public",
        }

        if (existingStorePost) {
          await tx.storePostImage.deleteMany({ where: { storePostId: existingStorePost.id } })
          await tx.storePostVideo.deleteMany({ where: { storePostId: existingStorePost.id } })
          await tx.storePost.update({
            where: { id: existingStorePost.id },
            data: {
              recipeId: effectiveRecipeId,
              ...commonFields,
              setIngredients: store.setIngredients ?? Prisma.DbNull,
              ...(store.storeImages && {
                images: {
                  create: store.storeImages.map((url) => ({ imageUrl: url })),
                },
              }),
              ...(store.storeVideos && {
                videos: {
                  create: store.storeVideos.map((url) => ({ videoUrl: url })),
                },
              }),
            },
          })
        } else {
          await tx.storePost.create({
            data: {
              userId: user.id,
              recipeId: effectiveRecipeId,
              ...commonFields,
              setIngredients: store.setIngredients ?? undefined,
              ...(store.storeImages && {
                images: {
                  create: store.storeImages.map((url) => ({ imageUrl: url })),
                },
              }),
              ...(store.storeVideos && {
                videos: {
                  create: store.storeVideos.map((url) => ({ videoUrl: url })),
                },
              }),
            },
          })
        }
      }

      // Update recipe record (skip if there are no content changes, e.g. store-only edit)
      if (!hasContentChanges) {
        return tx.recipe.findUnique({
          where: { id: recipeId },
          include: {
            recipeIngredients: {
              include: { ingredient: { include: { category: true } } },
            },
            images: true,
            videos: true,
            equipmentItems: true,
          },
        });
      }

      return tx.recipe.update({
        where: { id: recipeId },
        data: {
          ...(recipeName !== undefined && { recipeName }),
          ...(description !== undefined && { description }),
          ...(instructions !== undefined && { instructions }),
          ...(bgColor !== undefined && { bgColor }),
          ...(aiProvider !== undefined && { aiProvider }),
          ...(visibility !== undefined && { visibility }),
          ...(referenceRecipeId !== undefined && { referenceRecipeId }),
          
          ...(ingredients && recipeIngredientsToCreate && {
            recipeIngredients: {
              create: recipeIngredientsToCreate
            }
          }),
          
          ...(equipmentItems && {
            equipmentItems: {
              create: equipmentItems.map(eq => ({ name: eq.name }))
            }
          }),
          
          ...(uniqueImageUrls && {
            images: {
              create: uniqueImageUrls.map(url => ({ imageUrl: url }))
            }
          }),
          
          ...(videos && {
            videos: {
              create: videos.map(url => ({ videoUrl: url }))
            }
          })
        },
        include: {
          recipeIngredients: {
            include: { ingredient: true }
          },
          images: true,
          videos: true,
          equipmentItems: true,
        }
      })
    }, {
      maxWait: 15000,
      timeout: 30000,
    })

    cache.del(`recipe:${recipeId}`)
    cache.delPrefix(`recipe:${recipeId}:`)
    return Response.json({ data: updatedRecipe })
  } catch (error) {
    console.error("PATCH /api/recipes/[id] error:", error)
    if (error instanceof HttpError) {
      return Response.json({ error: error.message }, { status: error.status })
    }
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
