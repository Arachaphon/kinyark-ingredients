const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    // 1. Find or create a test user
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'testcascade@example.com',
          username: 'testcascade',
          role: 'USER'
        }
      });
    }

    // 2. Find or create an ingredient
    let ingredient = await prisma.ingredient.findFirst({ where: { name: 'วัตถุดิบทดสอบคาสเคด' } });
    if (!ingredient) {
      ingredient = await prisma.ingredient.create({
        data: {
          name: 'วัตถุดิบทดสอบคาสเคด'
        }
      });
    }
    console.log('🌱 Step 2: Ingredient exists in DB:', ingredient.name);

    // 3. Create a recipe linked to this ingredient
    const recipe = await prisma.recipe.create({
      data: {
        userId: user.id,
        recipeName: 'สูตรอาหารทดสอบคาสเคด',
        visibility: 'private',
        recipeIngredients: {
          create: [
            {
              ingredientId: ingredient.id,
              quantity: 1,
              unit: 'ฟอง'
            }
          ]
        }
      }
    });
    console.log('🍳 Step 3: Recipe created and linked to ingredient.');

    // 4. Delete the recipe
    console.log('🗑️ Step 4: Deleting the recipe...');
    await prisma.recipe.delete({ where: { id: recipe.id } });

    // 5. Verify the ingredient STILL EXISTS
    const verifiedIngredient = await prisma.ingredient.findUnique({
      where: { id: ingredient.id }
    });
    
    if (verifiedIngredient) {
      console.log('✅ Success: Ingredient STILL EXISTS in database after recipe deletion!');
    } else {
      console.error('❌ Failure: Ingredient was deleted along with the recipe!');
    }

    // Clean up test ingredient
    await prisma.ingredient.delete({ where: { id: ingredient.id } });

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
