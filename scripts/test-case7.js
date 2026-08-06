const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const name = "ไข่ไก่ทดสอบหมวดหมู่";
    const categoryId = 3; // Vegetables

    const ingredient = await prisma.ingredient.upsert({
      where: { name },
      update: { categoryId },
      create: { name, categoryId },
      include: { category: true },
    });
    console.log('JSON RESULT:', JSON.stringify({ data: ingredient }, null, 2));

    // Clean up
    await prisma.ingredient.delete({ where: { name } });
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
