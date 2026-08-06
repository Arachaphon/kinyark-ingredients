const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const categories = await prisma.category.findMany();
    console.log('Categories in DB:', categories);
    
    const ingredients = await prisma.ingredient.findMany({
      where: { name: { contains: 'หมู' } },
      take: 5
    });
    console.log('Pork Ingredients:', ingredients.map(i => i.name));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
