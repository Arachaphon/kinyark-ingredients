const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resolveCategoryId(category, categoryId) {
  if (categoryId !== undefined) return categoryId
  if (!category) return null

  const existing = await prisma.category.findFirst({
    where: { name: { equals: category, mode: "insensitive" } },
  })
  if (existing) return existing.id

  const created = await prisma.category.create({ data: { name: category } })
  return created.id
}

async function run() {
  try {
    const name = 'ไข่ไก่';
    const category = 'Dairy & Eggs';
    const categoryId = undefined;
    
    console.log('Resolving category...');
    const resolvedCategoryId = await resolveCategoryId(category, categoryId)
    console.log('Resolved category ID:', resolvedCategoryId);

    console.log('Upserting ingredient...');
    const ingredient = await prisma.ingredient.upsert({
      where: { name },
      update: { categoryId: resolvedCategoryId },
      create: { name, categoryId: resolvedCategoryId },
      include: { category: true },
    })
    console.log('Success:', ingredient);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
