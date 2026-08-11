import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { deleteFileByUrl } from "@/lib/storage"
import { recipeIdParamSchema, updateRecipeSchema } from "@/lib/validations/recipe.schema"
import { Prisma } from "@prisma/client"

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const parsed = recipeIdParamSchema.safeParse({ id })

    if (!parsed.success) {
      return Response.json({ error: "Invalid recipe ID" }, { status: 400 })
    }

    const recipeId = parsed.data.id

    const userId = _request.headers.get("x-user-id")
    const userRole = _request.headers.get("x-user-role")
    const user = userId ? { id: userId, role: userRole } : null

    console.log(`=== RECIPE DETAIL PROFILING START: ${recipeId} ===`)
    console.time("1. Parallel Queries")
    const [recipe, recipeIngredients, equipmentItems, images, videos, reviews, storePosts] = await Promise.all([
      prisma.recipe.findUnique({
        where: { id: recipeId },
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true },
          }
        }
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
      prisma.review.findMany({
        where: { recipeId },
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
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
    console.timeEnd("1. Parallel Queries")

    if (!recipe) {
      console.log("=== RECIPE DETAIL PROFILING END (404) ===\n")
      return Response.json({ error: "Recipe not found" }, { status: 404 })
    }

    const fullRecipe = {
      ...recipe,
      recipeIngredients,
      equipmentItems,
      images,
      videos,
      reviews,
      storePosts,
    }

    const isStorePostOwner = user
       ? storePosts.some((sp) => sp.userId === user.id)
       : false

    // Private and Draft recipes are only visible to their owner (or store post owner)
    if ((recipe.visibility === "private" || recipe.visibility === "draft") &&
        recipe.userId !== user?.id && !isStorePostOwner) {
      console.log("=== RECIPE DETAIL PROFILING END (404-visibility) ===\n")
      return Response.json({ error: "Recipe not found" }, { status: 404 })
    }

    // Protected recipes are hidden from STORE role users (except the recipe/store post owner)
    if (recipe.visibility === "protected" && user && recipe.userId !== user.id && !isStorePostOwner) {
      if (user.role === "STORE") {
        console.log("=== RECIPE DETAIL PROFILING END (404-protected) ===\n")
        return Response.json({ error: "Recipe not found" }, { status: 404 })
      }
    }

    console.time("2. Favorite Query")
    const favorite = user
      ? await prisma.favorite.findUnique({
          where: { userId_recipeId: { userId: user.id, recipeId } },
        })
      : null
    console.timeEnd("2. Favorite Query")
    console.log("=== RECIPE DETAIL PROFILING END ===\n")

    return Response.json(
      { data: { ...fullRecipe, isFavorite: favorite !== null } },
      { status: 200 }
    )
  } catch (error) {
    console.error("GET /api/recipes/[id] error:", error)
    return Response.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id")

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = { id: userId }
  const supabase = await createClient()

  const { id: rawId } = await params

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
    await prisma.$transaction([
      prisma.reviewLike.deleteMany({ where: { review: { recipeId } } }),
      prisma.review.deleteMany({ where: { recipeId } }),
      prisma.favorite.deleteMany({ where: { recipeId } }),
      prisma.recipeIngredient.deleteMany({ where: { recipeId } }),
      prisma.recipeEquipment.deleteMany({ where: { recipeId } }),
      prisma.recipeImage.deleteMany({ where: { recipeId } }),
      prisma.recipeVideo.deleteMany({ where: { recipeId } }),
      prisma.recipe.delete({ where: { id: recipeId } }),
    ])

    // 4. Delete files from Supabase Storage Bucket
    for (const url of [...imageUrls, ...storeImageUrls]) {
      await deleteFileByUrl(supabase, url)
    }

    for (const url of [...videoUrls, ...storeVideoUrls]) {
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const user = { id: userId }
    const supabase = await createClient()

    const { id } = await params
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
        
        const savedIngredients = await Promise.all(
          ingredients.map(async (ingredient) => {
            const dataToCreate: { name: string; categoryId?: number } = { name: ingredient.name };
            if (ingredient.category) {
              const cat = await tx.category.findFirst({
                where: { name: { equals: ingredient.category, mode: 'insensitive' } }
              });
              if (cat) {
                dataToCreate.categoryId = cat.id;
              }
            }
            return tx.ingredient.upsert({
              where: { name: ingredient.name },
              update: {},
              create: dataToCreate,
            })
          })
        );

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
