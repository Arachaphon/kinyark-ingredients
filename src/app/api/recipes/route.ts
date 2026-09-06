import { prisma } from "@/lib/prisma"
import { recipeListItemSelect } from "@/lib/recipes"
import { upsertRecipeIngredients } from "@/lib/ingredients"
import { createRecipeSchema, recipeListQuerySchema } from "@/lib/validations/recipe.schema"
import { Prisma } from "@prisma/client"
import { cache, TTL_RECIPES_LIST, TTL_RECIPES_MINE } from "@/lib/cache"
import { getAuthUserId } from "@/lib/auth-user"

type OrphanedStorePost = Prisma.StorePostGetPayload<{
  include: {
    user: { select: { id: true; username: true; avatarUrl: true } }
    images: true
    videos: true
  }
}>

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const parsed = recipeListQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      mine: searchParams.get("mine") ?? undefined,
      publicOnly: searchParams.get("publicOnly") ?? undefined,
      aiProvider: searchParams.get("aiProvider") ?? undefined,
      authorType: searchParams.get("authorType") ?? undefined,
    })

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues.map((issue) => issue.message).join("; ") },
        { status: 400 }
      )
    }

    const { page, limit, mine, publicOnly, aiProvider, authorType } = parsed.data

    const userId = await getAuthUserId(request)
    const userRole = request.headers.get("x-user-role")
    const user = userId ? { id: userId, role: userRole } : null

    if (mine) {
      if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
      }

      const cacheKey = `recipes:mine:${userId}:${page}:${limit}`
      const cached = cache.get(cacheKey)
      if (cached) {
        return Response.json(cached)
      }

      const userRecipesWhere: Prisma.RecipeWhereInput = {
        OR: [
          { userId: user.id },
          { storePosts: { some: { userId: user.id } } },
        ],
      }

      const [
        [total, recipes],
        orphanedStorePosts
      ] = await Promise.all([
        Promise.all([
          prisma.recipe.count({ where: userRecipesWhere }),
          prisma.recipe.findMany({
            where: userRecipesWhere,
            select: recipeListItemSelect({ withUser: true, withIngredients: true, storePostUserId: user.id }),
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
          }),
        ]),
        prisma.storePost.findMany({
          where: {
            userId: user.id,
            recipeId: null,
          },
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
            images: { orderBy: { createdAt: "asc" } },
            videos: { orderBy: { createdAt: "asc" } },
          },
          orderBy: { createdAt: "desc" },
        })
      ])

      const dummyRecipesForOrphans = orphanedStorePosts.map((sp) => ({
        id: `orphan-${sp.id}`,
        recipeName: "",
        rating: 0,
        favoriteCount: 0,
        createdAt: sp.createdAt.toISOString(),
        bgColor: null,
        visibility: sp.visibility,
        images: [],
        user: sp.user,
        recipeIngredients: [],
        storePosts: [{
          id: sp.id,
          userId: sp.userId,
          recipeId: "",
          storeName: sp.storeName,
          sellingPrice: sp.sellingPrice,
          storeDescription: sp.storeDescription,
          storeLocation: sp.storeLocation,
          contactInfo: sp.contactInfo,
          setIngredients: sp.setIngredients as unknown as Array<{ name: string; quantity: string | number; unit: string; }>,
          visibility: sp.visibility,
          createdAt: sp.createdAt.toISOString(),
          user: sp.user,
          images: sp.images,
          videos: sp.videos,
        }],
      }))

      const combinedData = [...recipes, ...dummyRecipesForOrphans]
      const totalCount = total + orphanedStorePosts.length
      const totalPages = Math.max(1, Math.ceil(totalCount / limit))

      const mineResponse = {
        data: combinedData,
        meta: { page, limit, total: totalCount, totalPages, userId: user.id },
      }
      cache.set(`recipes:mine:${userId}:${page}:${limit}`, mineResponse, TTL_RECIPES_MINE)
      return Response.json(mineResponse)
    }

    // Determine visibility filter based on user role
    // In public feed, drafts and private posts are NEVER shown to anyone
    let visibilityFilter: Prisma.RecipeWhereInput;

    if (publicOnly) {
      visibilityFilter = { visibility: "public" };
    } else if (user && userRole === "STORE") {
      // Store users can see public recipes and their own protected recipes
      visibilityFilter = {
        OR: [
          { visibility: "public" },
          { userId: user.id, visibility: "protected" },
        ]
      };
    } else {
      visibilityFilter = { visibility: { in: ["public", "protected"] } };
    }

    let authorFilter: Prisma.RecipeWhereInput = {};
    if (authorType === "user") {
      authorFilter = { aiProvider: null };
    } else if (authorType === "ai") {
      authorFilter = aiProvider ? { aiProvider } : { aiProvider: { not: null } };
    } else if (aiProvider) {
      authorFilter = { aiProvider };
    }

    const where: Prisma.RecipeWhereInput = {
      ...visibilityFilter,
      ...authorFilter,
    };

    const cacheKey = `recipes:list:${page}:${limit}:${aiProvider ?? "all"}:${authorType ?? "all"}`
    if (process.env.NODE_ENV !== 'test') {
      const cached = cache.get(cacheKey)
      if (cached) {
        return Response.json(cached)
      }
    }

    const isAiOnly = authorType === "ai" || Boolean(aiProvider);
    const storePostVisibilityConditions: Prisma.StorePostWhereInput = {
      recipeId: null,
    };
    
    // Check auth for visibility filtering of orphaned store posts
    if (user && userRole === "STORE") {
      storePostVisibilityConditions.OR = [
        { visibility: "public" },
        { userId: user.id, visibility: "protected" }
      ];
    } else {
      storePostVisibilityConditions.visibility = { in: ["public", "protected"] };
    }

    const [
      [total, recipes],
      [orphanedStorePosts, totalOrphanedStorePosts]
    ] = await Promise.all([
      Promise.all([
        prisma.recipe.count({ where }),
        prisma.recipe.findMany({
          where,
          select: recipeListItemSelect({ withUser: true, withIngredients: true }),
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]),
      isAiOnly
        ? Promise.resolve([[], 0] as [OrphanedStorePost[], number])
        : Promise.all([
            prisma.storePost.findMany({
              where: storePostVisibilityConditions,
              include: {
                user: { select: { id: true, username: true, avatarUrl: true } },
                images: { orderBy: { createdAt: "asc" } },
                videos: { orderBy: { createdAt: "asc" } },
              },
              orderBy: { createdAt: "desc" },
              skip: (page - 1) * limit,
              take: limit,
            }),
            prisma.storePost.count({
              where: storePostVisibilityConditions,
            }),
          ])
    ])

    const dummyRecipesForOrphans = orphanedStorePosts.map((sp) => ({
      id: `orphan-${sp.id}`,
      recipeName: "",
      rating: 0,
      favoriteCount: 0,
      createdAt: sp.createdAt.toISOString(),
      bgColor: null,
      visibility: sp.visibility,
      images: [],
      user: sp.user,
      recipeIngredients: [],
      storePosts: [{
        id: sp.id,
        userId: sp.userId,
        recipeId: "",
        storeName: sp.storeName,
        sellingPrice: sp.sellingPrice,
        storeDescription: sp.storeDescription,
        storeLocation: sp.storeLocation,
        contactInfo: sp.contactInfo,
        setIngredients: sp.setIngredients as unknown as Array<{ name: string; quantity: string | number; unit: string; }>,
        visibility: sp.visibility,
        createdAt: sp.createdAt.toISOString(),
        user: sp.user,
        images: sp.images,
        videos: sp.videos,
      }],
    }))

    const combinedData = [...recipes, ...dummyRecipesForOrphans]
    const totalWithOrphans = total + totalOrphanedStorePosts
    const totalPages = Math.max(1, Math.ceil(totalWithOrphans / limit))

    const listResponse = {
      data: combinedData,
      meta: { page, limit, total: totalWithOrphans, totalPages },
    }
    cache.set(cacheKey, listResponse, TTL_RECIPES_LIST)
    return Response.json(listResponse)
  } catch (error) {
    console.error("Error fetching recipes:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const userId = await getAuthUserId(request)

  if (!userId) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }
  const user = { id: userId }

  const body = await request.json()

  const result = createRecipeSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      {
        error: result.error.issues.map((issue) => issue.message).join("; "),
      },
      {
        status: 400,
      }
    )
  }

  try {
    const {
      recipeName,
      description,
      instructions,
      ingredients,
      equipmentItems = [],
      store,
      featuredImageUrl,
      images = [],
      videos = [],
      bgColor,
      aiProvider,
      visibility,
      systemRecipeId,
      referenceRecipeId,
    } = result.data;

    const allImageUrls = [featuredImageUrl, ...images].filter((url): url is string => !!url);
    const uniqueImageUrls = Array.from(new Set(allImageUrls));

    const equipmentToCreate = equipmentItems.map((equipment) => ({
      name: equipment.name,
    }));

    const imagesToCreate = uniqueImageUrls.map((url) => ({
      imageUrl: url,
    }));

    const videosToCreate = videos.map((url) => ({
      videoUrl: url,
    }));

    const recipe = await prisma.$transaction(async (tx) => {
      if (systemRecipeId && store) {
        const existingRecipe = await tx.recipe.findUnique({
          where: { id: systemRecipeId }
        });
        if (!existingRecipe) {
          throw new Error("System recipe not found");
        }
        await tx.storePost.create({
          data: {
            userId: user.id,
            recipeId: systemRecipeId,
            storeName: store.storeName,
            sellingPrice: store.sellingPrice,
            storeDescription: store.storeDescription,
            storeLocation: store.storeLocation,
            contactInfo: store.contactInfo,
            visibility: store.visibility ?? visibility,
            setIngredients: store.setIngredients ? store.setIngredients : undefined,
            ...(store.storeImages && store.storeImages.length > 0 && {
              images: {
                create: store.storeImages.map((url) => ({ imageUrl: url })),
              },
            }),
            ...(store.storeVideos && store.storeVideos.length > 0 && {
              videos: {
                create: store.storeVideos.map((url) => ({ videoUrl: url })),
              },
            }),
          }
        });
        
        return tx.recipe.findUnique({
          where: { id: systemRecipeId },
          include: {
            storePosts: { include: { images: true, videos: true } },
            images: true,
            videos: true,
          }
        });
      }

      const savedIngredients = await upsertRecipeIngredients(tx, ingredients)

      const recipeIngredientsToCreate = savedIngredients.map((savedIngredient, index) => {
        const requestedIngredient = ingredients[index];
        return {
          ingredientId: savedIngredient.id,
          quantity: requestedIngredient.quantity,
          unit: requestedIngredient.unit,
        };
      });

      return tx.recipe.create({
        data: {
          userId: user.id,
          recipeName,
          description,
          instructions,
          bgColor,
          aiProvider,
          visibility,
          referenceRecipeId,
          recipeIngredients: {
            create: recipeIngredientsToCreate,
          },
          ...(equipmentToCreate.length > 0 && {
            equipmentItems: {
              create: equipmentToCreate,
            },
          }),
          ...(store && {
            storePosts: {
              create: {
                userId: user.id,
                storeName: store.storeName,
                sellingPrice: store.sellingPrice,
                storeDescription: store.storeDescription,
                storeLocation: store.storeLocation,
                contactInfo: store.contactInfo,
                visibility: store.visibility ?? visibility,
                setIngredients: store.setIngredients ? store.setIngredients : undefined,
                ...(store.storeImages && store.storeImages.length > 0 && {
                  images: {
                    create: store.storeImages.map((url) => ({ imageUrl: url })),
                  },
                }),
                ...(store.storeVideos && store.storeVideos.length > 0 && {
                  videos: {
                    create: store.storeVideos.map((url) => ({ videoUrl: url })),
                  },
                }),
              },
            },
          }),
          ...(imagesToCreate.length > 0 && {
            images: {
              create: imagesToCreate,
            },
          }),
          ...(videosToCreate.length > 0 && {
            videos: {
              create: videosToCreate,
            },
          }),
        },
        include: {
          storePosts: {
            include: {
              images: true,
              videos: true,
            },
          },
          images: true,
          videos: true,
        },
      });
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    cache.delPrefix('recipes:list:')
    cache.delPrefix(`recipes:mine:${userId}:`)

    return Response.json(
      {
        data: recipe,
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        error: error instanceof Error ? error.message : String(error),
        details: error,
      },
      {
        status: 500,
      }
    )
  }
}