import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const TARGET_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

const IMAGE_MAPPING: Record<string, { filename: string; fallback: string }> = {
  tomyum: {
    filename: 'tomyum.jpg',
    fallback: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
  },
  greencurry: {
    filename: 'greencurry.jpg',
    fallback: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&auto=format&fit=crop&q=80',
  },
  padthai: {
    filename: 'padthai.jpg',
    fallback: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80',
  },
  crabfriedrice: {
    filename: 'crabfriedrice.jpg',
    fallback: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
  },
  somtum: {
    filename: 'somtum.jpg',
    fallback: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&auto=format&fit=crop&q=80',
  },
  larb: {
    filename: 'larb.jpg',
    fallback: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&auto=format&fit=crop&q=80',
  },
  porksteak: {
    filename: 'porksteak.jpg',
    fallback: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&auto=format&fit=crop&q=80',
  },
  steakset: {
    filename: 'steakset.jpg',
    fallback: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
  },
  tomyumset: {
    filename: 'tomyumset.jpg',
    fallback: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
  },
  tomkhakai: {
    filename: 'tomkhakai.jpg',
    fallback: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
  },
  tomkhakaiset: {
    filename: 'tomkhakaiset.jpg',
    fallback: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
  },
}

function getMappedImage(key: string): string {
  const mapping = IMAGE_MAPPING[key]
  if (!mapping) {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'
  }

  const targetFilename = mapping.filename
  const localTargetPath = path.join(TARGET_UPLOAD_DIR, targetFilename)

  if (fs.existsSync(localTargetPath)) {
    return `https://arfkqidacjseglvfuitj.supabase.co/storage/v1/object/public/recipes/uploads/${targetFilename}`
  }

  return mapping.fallback
}

async function getUserIdByEmail(email: string, fallbackUsername: string, role: string = 'USER'): Promise<string> {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    if (existingUser.role !== role || existingUser.username !== fallbackUsername) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { role, username: fallbackUsername },
      })
    }
    return existingUser.id
  }

  const newUser = await prisma.user.create({
    data: {
      email,
      username: fallbackUsername,
      role,
    },
  })
  console.log(`👤 Created missing user: ${email} (${role})`)
  return newUser.id
}

async function main() {
  console.log('🌱 Starting comprehensive data seed simulation...')

  // 1. Prepare Target Users
  const user1Id = await getUserIdByEmail('arachaporn1622549@gmail.com', 'user1_arachaporn', 'USER')
  const user2Id = await getUserIdByEmail('focus1622549@gmail.com', 'user2_focus', 'USER')
  const store1Id = await getUserIdByEmail('wellg519@gmail.com', 'store1_wellg', 'STORE')

  const targetUserIds = [user1Id, user2Id, store1Id]

  // Clean up user activity tables for target users
  await prisma.favorite.deleteMany({ where: { userId: { in: targetUserIds } } })
  await prisma.searchHistory.deleteMany({ where: { userId: { in: targetUserIds } } })
  await prisma.reviewLike.deleteMany({ where: { userId: { in: targetUserIds } } })
  await prisma.review.deleteMany({ where: { userId: { in: targetUserIds } } })
  await prisma.storePost.deleteMany({ where: { userId: { in: targetUserIds } } })
  await prisma.recipe.deleteMany({ where: { userId: { in: targetUserIds } } })

  console.log('🧹 Cleaned up existing recipes, posts, favorites, search histories for target users.')

  const ingredientIdsByName = async (names: string[]): Promise<number[]> => {
    const rows = await prisma.ingredient.findMany({
      where: { name: { in: names } },
      select: { id: true },
    })
    return rows.map((i) => i.id)
  }

  // 2. Create Recipes for user1, user2, store1 (Each gets 3 recipes minimum, total 9 recipes)
  const recipeDefs = [
    // --- USER 1 RECIPES (3 recipes) ---
    {
      userId: user1Id,
      recipeName: 'ต้มยำกุ้งน้ำข้นสูตรเด็ด',
      description: 'ต้มยำกุ้งน้ำข้นรสจัดจ้าน เครื่องสมุนไพรสดและพริกเผา',
      visibility: 'public',
      imageKey: 'tomyum',
      ingredients: ['กุ้ง', 'ตะไคร้', 'ข่า', 'ใบมะกรูด', 'พริกขี้หนู'],
    },
    {
      userId: user1Id,
      recipeName: 'แกงเขียวหวานไก่กะทิสด',
      description: 'แกงเขียวหวานไก่รสเข้มข้น หอมพริกแกงและกะทิสด',
      visibility: 'public',
      imageKey: 'greencurry',
      ingredients: ['ไก่', 'กะทิกล่อง', 'ใบมะกรูด', 'พริก'],
    },
    {
      userId: user1Id,
      recipeName: 'ไข่เจียวหมูสับฟูกรอบ',
      description: 'ไข่เจียวหมูสับทอดฟูกรอบ หอมอร่อยทานคู่ข้าวสวยร้อนๆ',
      visibility: 'public',
      imageKey: 'larb',
      ingredients: ['ไข่ไก่', 'หมูสับ'],
    },

    // --- USER 2 RECIPES (3 recipes) ---
    {
      userId: user2Id,
      recipeName: 'ผัดไทยกุ้งสดห่อไข่',
      description: 'ผัดไทยเส้นเหนียวนุ่ม รสชาติกลมกล่อม ห่อด้วยไข่บางกรอบ',
      visibility: 'public',
      imageKey: 'padthai',
      ingredients: ['กุ้ง', 'ไข่ไก่', 'ถั่วงอก', 'มะนาวเขียว'],
    },
    {
      userId: user2Id,
      recipeName: 'ข้าวผัดปูจักรพรรดิ',
      description: 'ข้าวผัดปูหอมกลิ่นกระทะ เนื้อปูก้อนตู้มๆ เมล็ดข้าวสวยร่วน',
      visibility: 'public',
      imageKey: 'crabfriedrice',
      ingredients: ['ข้าวหอมมะลิ', 'ปู', 'ไข่ไก่'],
    },
    {
      userId: user2Id,
      recipeName: 'ส้มตำไทยไข่เค็ม',
      description: 'ส้มตำมะละกอกรอบ รสชาติเปรี้ยวหวานเค็มเผ็ด ทานคู่ไข่เค็ม',
      visibility: 'public',
      imageKey: 'somtum',
      ingredients: ['มะละกอ', 'ไข่เค็ม', 'มะเขือเทศ', 'พริกขี้หนู'],
    },

    // --- STORE 1 RECIPES (3 recipes) ---
    {
      userId: store1Id,
      recipeName: 'สเต็กหมูพริกไทยดำโฮมเมด',
      description: 'เนื้อหมูย่างพริกไทยดำ นุ่มชุ่มฉ่ำ ซอสพริกไทยดำเข้มข้น',
      visibility: 'public',
      imageKey: 'porksteak',
      ingredients: ['หมู', 'พริกไทยดำ', 'เนยจืด'],
    },
    {
      userId: store1Id,
      recipeName: 'ต้มข่าไก่สมุนไพร',
      description: 'ต้มข่าไก่กะทิสด อมเปรี้ยวมะนาว กลมกล่อมละมุนลิ้น',
      visibility: 'public',
      imageKey: 'tomkhakai',
      ingredients: ['ไก่', 'ข่า', 'กะทิกล่อง', 'ตะไคร้'],
    },
    {
      userId: store1Id,
      recipeName: 'ลาบหมูคั่วสไตล์ล้านนา',
      description: 'ลาบหมูคั่วหอมกลิ่นเครื่องเทศ รสชาติเข้มข้นเป็นเอกลักษณ์',
      visibility: 'public',
      imageKey: 'larb',
      ingredients: ['หมู', 'พริก', 'หอมแดง'],
    },
  ]

  const createdRecipes: Record<string, any[]> = {
    [user1Id]: [],
    [user2Id]: [],
    [store1Id]: [],
  }

  for (const rData of recipeDefs) {
    const ingredientIds = await ingredientIdsByName(rData.ingredients)
    const recipe = await prisma.recipe.create({
      data: {
        userId: rData.userId,
        recipeName: rData.recipeName,
        description: rData.description,
        visibility: rData.visibility,
        instructions: '1. เตรียมวัตถุดิบ\n2. ปรุงอาหารตามขั้นตอน\n3. จัดเสิร์ฟร้อนๆ',
        bgColor: '#FFFBEB',
        images: rData.imageKey ? {
          create: [{ imageUrl: getMappedImage(rData.imageKey) }]
        } : undefined,
        recipeIngredients: {
          create: ingredientIds.map((ingredientId) => ({
            ingredient: { connect: { id: ingredientId } },
            quantity: 100,
            unit: 'กรัม',
          })),
        },
      },
    })
    createdRecipes[rData.userId].push(recipe)
  }

  console.log(`🍳 Created 9 recipes (3 recipes per user/store).`)

  // 3. Create Favorites (3 favorites for User 1 & 3 favorites for User 2)
  // User 1 favorites: 3 recipes created by User 2 & Store 1
  const favsForUser1 = [
    createdRecipes[user2Id][0].id, // ผัดไทย
    createdRecipes[user2Id][1].id, // ข้าวผัดปู
    createdRecipes[store1Id][0].id, // สเต็กหมู
  ]
  for (const rId of favsForUser1) {
    await prisma.favorite.create({
      data: { userId: user1Id, recipeId: rId },
    })
    await prisma.recipe.update({
      where: { id: rId },
      data: { favoriteCount: { increment: 1 } },
    })
  }

  // User 2 favorites: 3 recipes created by User 1 & Store 1
  const favsForUser2 = [
    createdRecipes[user1Id][0].id, // ต้มยำกุ้ง
    createdRecipes[user1Id][1].id, // แกงเขียวหวาน
    createdRecipes[store1Id][1].id, // ต้มข่าไก่
  ]
  for (const rId of favsForUser2) {
    await prisma.favorite.create({
      data: { userId: user2Id, recipeId: rId },
    })
    await prisma.recipe.update({
      where: { id: rId },
      data: { favoriteCount: { increment: 1 } },
    })
  }

  console.log('❤️ Created 3 favorites each for arachaporn1622549@gmail.com and focus1622549@gmail.com.')

  // 4. Create Search History (Search queries for both users)
  const searchQueriesUser1 = ['ต้มยำกุ้ง', 'ผัดไทย', 'กุ้งสด']
  for (const q of searchQueriesUser1) {
    await prisma.searchHistory.create({
      data: { userId: user1Id, searchQuery: q },
    })
  }

  const searchQueriesUser2 = ['ส้มตำ', 'ข้าวผัดปู', 'สเต็ก']
  for (const q of searchQueriesUser2) {
    await prisma.searchHistory.create({
      data: { userId: user2Id, searchQuery: q },
    })
  }

  console.log('🔍 Created search history queries for both users.')

  // 5. Create Store Post for store1 (wellg519@gmail.com)
  const store1SteakRecipe = createdRecipes[store1Id][0]
  await prisma.storePost.create({
    data: {
      userId: store1Id,
      recipeId: store1SteakRecipe.id,
      storeName: 'WellG Premium Meat & Steak Store',
      sellingPrice: 199.00,
      storeDescription: 'ชุดวัตถุดิบสเต็กหมูพริกไทยดำสำเร็จรูป พร้อมเนยสดแท้ ซอสหมัก และพริกไทยดำเกรดพรีเมียม',
      storeLocation: 'กรุงเทพมหานคร เขตปทุมวัน',
      contactInfo: 'Line: @wellg_meat | Tel: 081-234-5678',
      visibility: 'public',
      setIngredients: [
        { name: 'หมูหมักพริกไทยดำ', amount: '250g' },
        { name: 'เนยสดแท้', amount: '30g' },
        { name: 'ซอสสเต็กพริกไทยดำ', amount: '50ml' },
      ],
      images: {
        create: [{ imageUrl: getMappedImage('steakset') }]
      },
    },
  })

  console.log('🏪 Created Store Post for store1 (wellg519@gmail.com).')

  console.log('✅ Simulation seed script completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during custom simulation seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
