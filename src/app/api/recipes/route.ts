import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { recipeListItemSelect } from "@/lib/recipes"
import { createRecipeSchema, recipeListQuerySchema } from "@/lib/validations/recipe.schema"
import { Prisma } from "@prisma/client"

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const parsed = recipeListQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      mine: searchParams.get("mine") ?? undefined,
    })

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { page, limit, mine } = parsed.data

    if (mine) {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
      }

      const [total, recipes] = await Promise.all([
        prisma.recipe.count({ where: { userId: user.id } }),
        prisma.recipe.findMany({
          where: { userId: user.id },
          select: recipeListItemSelect({ withUser: true, withIngredients: true }),
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ])

      const totalPages = Math.max(1, Math.ceil(total / limit))

      return Response.json({
        data: recipes,
        meta: { page, limit, total, totalPages },
      })
    }

    const where: Prisma.RecipeWhereInput = { visibility: "public" }

    const [total, recipes] = await Promise.all([
      prisma.recipe.count({ where }),
      prisma.recipe.findMany({
        where,
        select: recipeListItemSelect({ withUser: true, withIngredients: true }),
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return Response.json({
      data: recipes,
      meta: { page, limit, total, totalPages },
    })
  } catch (error) {
    console.error("Error fetching recipes:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const body = await request.json()

  const result = createRecipeSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      {
        error: result.error.flatten(),
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