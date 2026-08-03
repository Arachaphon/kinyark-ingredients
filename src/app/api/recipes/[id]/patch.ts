import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { recipeIdParamSchema, updateRecipeSchema } from "@/lib/validations/recipe.schema"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const parsedId = recipeIdParamSchema.safeParse({ id })

    if (!parsedId.success) {
      return Response.json({ error: "Invalid recipe ID" }, { status: 400 })
    }

    const recipeId = parsedId.data.id

    // Check if recipe exists and user is owner
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: recipeId }
    })

    if (!existingRecipe) {
      return Response.json({ error: "Recipe not found" }, { status: 404 })
    }

    if (existingRecipe.userId !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const result = updateRecipeSchema.safeParse(body)

    if (!result.success) {
      return Response.json({ error: result.error.flatten() }, { status: 400 })
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
      referenceRecipeId
    } = result.data

    // 1. Process images and videos
    let uniqueImageUrls: string[] | undefined;
    if (featuredImageUrl !== undefined || images !== undefined) {
      const allImageUrls = [
        ...(featuredImageUrl ? [featuredImageUrl] : []),
        ...(images || [])
      ].filter((url): url is string => !!url)
      uniqueImageUrls = Array.from(new Set(allImageUrls))
    }

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

      // Update recipe record
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
    })

    return Response.json({ data: updatedRecipe })
  } catch (error) {
    console.error("PATCH /api/recipes/[id] error:", error)
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
