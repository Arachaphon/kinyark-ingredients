import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const user = await prisma.user.findFirst()
    if (!user) throw new Error("No user found")

    const recipe = await prisma.$transaction(async (tx) => {
      const savedIngredients = await Promise.all(
        [{name: "TestIng1", quantity: 1, unit: "piece"}].map((ingredient) =>
          tx.ingredient.upsert({
            where: { name: ingredient.name },
            update: {},
            create: { name: ingredient.name },
          })
        )
      );

      const recipeIngredientsToCreate = savedIngredients.map((savedIngredient, index) => {
        return {
          ingredientId: savedIngredient.id,
          quantity: 1,
          unit: "piece",
        };
      });

      return tx.recipe.create({
        data: {
          userId: user.id,
          recipeName: "Test Recipe",
          description: "Test",
          visibility: "public",
          recipeIngredients: {
            create: recipeIngredientsToCreate,
          },
        },
      });
    });

    console.log("Success:", recipe.id)
  } catch (error) {
    console.error("DB Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
