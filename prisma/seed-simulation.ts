import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Paths for image handling
const TARGET_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

// Map key to specific filename
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

// Function to check and fetch image from public/uploads directly
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

async function getUserIdByEmail(email: string, fallbackUsername: string): Promise<string> {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return existingUser.id
  }

  // Create fallback user if not found
  const newUser = await prisma.user.create({
    data: {
      email,
      username: fallbackUsername,
      role: email.includes('store') || email.includes('wellg') || email.includes('fflower') || email.includes('67023031') ? 'STORE' : 'USER',
    },
  })
  console.log(`👤 Created missing user: ${email}`)
  return newUser.id
}

async function main() {
  console.log('🌱 Starting 20-recipe simulation seed based on percentages...')

  // Fetch or create users
  const user1Id = await getUserIdByEmail('arachaporn1622549@gmail.com', 'user1_arachaporn')
  const user2Id = await getUserIdByEmail('focus1622549@gmail.com', 'user2_focus')
  const user3Id = await getUserIdByEmail('sukijung7@gmail.com', 'user3_sukijung')

  const store1Id = await getUserIdByEmail('wellg519@gmail.com', 'store1_wellg')
  const store2Id = await getUserIdByEmail('fflowerlian@gmail.com', 'store2_fflower')
  const store3Id = await getUserIdByEmail('67023031@up.ac.th', 'store3_up')

  // Clean up existing recipes & store posts of these users to prevent duplicates
  const userIds = [user1Id, user2Id, user3Id, store1Id, store2Id, store3Id]
  
  await prisma.storePost.deleteMany({
    where: { userId: { in: userIds } }
  })
  
  await prisma.recipe.deleteMany({
    where: { userId: { in: userIds } }
  })
  
  console.log('🧹 Cleaned up existing recipes and store posts for simulation users.')

  // Fetch some ingredients for linkage
  const pork = await prisma.ingredient.findFirst({ where: { name: 'หมูสับ' } })
  const shrimp = await prisma.ingredient.findFirst({ where: { name: 'กุ้ง' } })

  // Define 20 recipes with pre-calculated distributions:
  // 1. Role (50/50): 10 USER recipes, 10 STORE recipes
  // 2. Visibility (40/25/20/15): 8 public (40%), 5 protected (25%), 4 private (20%), 3 draft (15%)
  // 3. Completeness (50/50 image / no-image): 10 with image, 10 without image
  const recipeDataList = [
    // --- 10 RECIPES BY USER ROLE ---
    {
      userId: user1Id,
      recipeName: 'ต้มยำกุ้งน้ำข้นสูตรคุณแม่',
      description: 'ต้มยำกุ้งน้ำข้นรสจัดจ้านแบบไทยดั้งเดิม หอมเครื่องสมุนไพรสดและพริกเผา',
      visibility: 'public', // 1/8 public
      imageKey: 'tomyum',   // 1/10 with image
    },
    {
      userId: user1Id,
      recipeName: 'แกงเขียวหวานไก่สูตรลับ',
      description: 'แกงเขียวหวานไก่รสเข้มข้น กลมกล่อม หอมกลิ่นมะพร้าวสดและพริกแกงใต้',
      visibility: 'private', // 1/4 private
      imageKey: null,         // 1/10 no image
    },
    {
      userId: user1Id,
      recipeName: 'ไข่เจียวหมูสับฟูกรอบ',
      description: 'ไข่เจียวหมูสับทอดในน้ำมันร้อนจัด ฟูกรอบ ไม่อมน้ำมัน ทานง่ายสำหรับทุกมื้อ',
      visibility: 'public', // 2/8 public
      imageKey: 'larb',      // 2/10 with image (reused larb as fallback/mock)
    },
    {
      userId: user1Id,
      recipeName: 'ต้มจืดเต้าหู้หมูสับสาหร่าย',
      description: 'ต้มจืดเต้าหู้ไข่เนื้อนุ่ม ซดร้อนๆ คล่องคอ ดีต่อสุขภาพ',
      visibility: 'protected', // 1/5 protected
      imageKey: null,          // 2/10 no image
    },
    {
      userId: user2Id,
      recipeName: 'ผัดไทยกุ้งสดห่อไข่',
      description: 'ผัดไทยเส้นเหนียวนุ่ม รสชาติกลมกล่อม ห่อด้วยไข่บางกรอบสวยงาม',
      visibility: 'protected', // 2/5 protected
      imageKey: 'padthai',    // 3/10 with image
    },
    {
      userId: user2Id,
      recipeName: 'ข้าวผัดปูสูตรเด็ดร้านดัง',
      description: 'ข้าวผัดปูแห้งหอมกลิ่นกระทะ เนื้อปูก้อนตู้มๆ เมล็ดข้าวสวยร่วน',
      visibility: 'draft',    // 1/3 draft
      imageKey: 'crabfriedrice', // 4/10 with image
    },
    {
      userId: user2Id,
      recipeName: 'ผัดซีอิ๊วหมูนุ่มเส้นใหญ่',
      description: 'เส้นใหญ่เหนียวนุ่ม ผัดกับไข่ คะน้า และหมูหมักนุ่มๆ รสชาติเข้มข้น',
      visibility: 'private',  // 2/4 private
      imageKey: null,         // 3/10 no image
    },
    {
      userId: user3Id,
      recipeName: 'ส้มตำไทยไข่เค็มครบรส',
      description: 'ส้มตำมะละกอกรอบ รสชาติเปรี้ยวหวานเค็มเผ็ดสะใจ ทานคู่ไข่เค็มมันๆ',
      visibility: 'public',   // 3/8 public
      imageKey: 'somtum',     // 5/10 with image
    },
    {
      userId: user3Id,
      recipeName: 'ลาบหมูคั่วสไตล์เหนือ',
      description: 'ลาบหมูคั่วหอมกลิ่นมะแขว่นและเครื่องเทศล้านนา รสชาติเป็นเอกลักษณ์',
      visibility: 'private',  // 3/4 private
      imageKey: 'larb',       // 6/10 with image
    },
    {
      userId: user3Id,
      recipeName: 'ยำวุ้นเส้นรวมมิตรทะเล',
      description: 'ยำวุ้นเส้นรสจัดจ้าน ครบเครื่องซีฟู้ดสดใหม่ เผ็ดเปรี้ยวหวานลงตัว',
      visibility: 'public',   // 4/8 public
      imageKey: null,         // 4/10 no image
    },

    // --- 10 RECIPES BY STORE ROLE ---
    {
      userId: store1Id,
      recipeName: 'สเต็กหมูพริกไทยดำโฮมเมด',
      description: 'เนื้อหมูย่างพริกไทยดำ นุ่มชุ่มฉ่ำ หมักซอสพริกไทยดำเข้มข้นสะใจ',
      visibility: 'public',   // 5/8 public
      imageKey: 'porksteak',  // 7/10 with image
    },
    {
      userId: store1Id,
      recipeName: 'ข้าวกะเพราหมูสับพริกแห้ง',
      description: 'ผัดกะเพราหมูสับแบบแห้งๆ เผ็ดร้อนด้วยพริกขี้หนูสวนและพริกแห้ง',
      visibility: 'public',   // 6/8 public
      imageKey: null,         // 5/10 no image
    },
    {
      userId: store1Id,
      recipeName: 'ข้าวไข่ข้นกุ้งกระเทียม',
      description: 'ข้าวไข่ข้นเนื้อเยิ้มๆ นุ่มละมุน เสิร์ฟคู่กับกุ้งผัดกระเทียมราดซอสหอมกรุ่น',
      visibility: 'protected', // 3/5 protected
      imageKey: null,          // 6/10 no image
    },
    {
      userId: store1Id,
      recipeName: 'หมูกระเทียมราดข้าวร้อนๆ',
      description: 'หมูชิ้นผัดซอสกระเทียมพริกไทย หอมกระเทียมเจียวกรอบ โรยพริกไทยดำป่น',
      visibility: 'draft',     // 2/3 draft
      imageKey: null,          // 7/10 no image
    },
    {
      userId: store2Id,
      recipeName: 'แกงส้มชะอมกุ้งสดแกงใต้',
      description: 'แกงส้มกุ้งสดรสเปรี้ยวเผ็ดร้อน หอมน้ำแกงส้มใต้เข้มข้น ทานกับไข่เจียวชะอม',
      visibility: 'protected', // 4/5 protected
      imageKey: 'tomyum',      // 8/10 with image
    },
    {
      userId: store2Id,
      recipeName: 'ผัดพริกแกงหมูป่าหน่อไม้ดอง',
      description: 'หมูป่าผัดเผ็ดพริกแกงใต้รสร้อนแรง ใส่หน่อไม้ดองและมะเขือพวง',
      visibility: 'private',   // 4/4 private
      imageKey: null,          // 8/10 no image
    },
    {
      userId: store2Id,
      recipeName: 'หมูสามชั้นคั่วพริกเกลือ',
      description: 'หมูสามชั้นเจียวน้ำมันออกจนกรอบ คั่วพริกขี้หนู กระเทียมสด และเกลือปรุงรส',
      visibility: 'public',    // 7/8 public
      imageKey: null,          // 9/10 no image
    },
    {
      userId: store3Id,
      recipeName: 'ต้มข่าไก่กะทิสดสมุนไพร',
      description: 'ต้มข่าไก่สูตรกะทิสด อมเปรี้ยวมะนาวแป้นเล็กน้อย กลมกล่อมละมุนลิ้น',
      visibility: 'public',    // 8/8 public
      imageKey: 'tomkhakai',  // 9/10 with image
    },
    {
      userId: store3Id,
      recipeName: 'ต้มซุปเปอร์ขาไก่สุดแซ่บ',
      description: 'ต้มยำขาไก่เปื่อยนุ่ม ซุปเปอร์รสเปรี้ยวเผ็ดร้อน พริกขี้หนูสวนทุบเต็มหม้อ',
      visibility: 'protected', // 5/5 protected
      imageKey: null,          // 10/10 no image
    },
    {
      userId: store3Id,
      recipeName: 'ข้าวผัดอเมริกันสูตรดั้งเดิม',
      description: 'ข้าวผัดซอสมะเขือเทศ ลูกเกด เมล็ดถั่ว เสิร์ฟพร้อมน่องไก่ทอด ไข่ดาว และไส้กรอก',
      visibility: 'draft',     // 3/3 draft
      imageKey: 'crabfriedrice', // 10/10 with image
    },
  ]

  // Create all 20 recipes
  const createdRecipes = []
  for (const rData of recipeDataList) {
    const recipe = await prisma.recipe.create({
      data: {
        userId: rData.userId,
        recipeName: rData.recipeName,
        description: rData.description,
        visibility: rData.visibility,
        instructions: '1. เตรียมวัตถุดิบและล้างให้สะอาด\n2. ตั้งเตาทำตามขั้นตอนปรุงอาหาร\n3. ปรุงรสตามใจชอบและจัดเสิร์ฟขณะร้อน',
        bgColor: '#FFFBEB',
        images: rData.imageKey ? {
          create: [{ imageUrl: getMappedImage(rData.imageKey) }]
        } : undefined,
        recipeIngredients: {
          create: [
            ...(pork ? [{ ingredientId: pork.id, quantity: 150, unit: 'กรัม' }] : []),
            ...(shrimp ? [{ ingredientId: shrimp.id, quantity: 100, unit: 'กรัม' }] : []),
          ]
        }
      }
    })
    createdRecipes.push(recipe)
  }
  console.log(`🍳 Successfully seeded ${createdRecipes.length} recipes (50% USER / 50% STORE).`)

  // --- SEED 3 STORE POSTS (SETS) ---
  console.log('🏪 Seeding Store Posts (Sets) for the stores...')
  
  // Find recipes to link
  const tomYumRecipe = createdRecipes.find(r => r.recipeName === 'ต้มยำกุ้งน้ำข้นสูตรคุณแม่')!
  const steakRecipe = createdRecipes.find(r => r.recipeName === 'สเต็กหมูพริกไทยดำโฮมเมด')!
  const tomKhaRecipe = createdRecipes.find(r => r.recipeName === 'ต้มข่าไก่กะทิสดสมุนไพร')!

  // Store 1: Links to own steak recipe (Case 1)
  await prisma.storePost.create({
    data: {
      userId: store1Id,
      recipeId: steakRecipe.id,
      storeName: 'WellG Premium Meat & Steak',
      sellingPrice: 189.00,
      storeDescription: 'เซ็ทสเต็กหมูพริกไทยดำดิบพร้อมปรุง ในชุดมีหมูหมักพริกไทยดำ, เนย, ซอส และผักเคียงครบครัน',
      storeLocation: 'กรุงเทพฯ เขตปทุมวัน',
      contactInfo: 'Line: @wellg_meat',
      visibility: 'public',
      setIngredients: [
        { name: 'หมูหมักพริกไทยดำ', amount: '200g' },
        { name: 'เนยสดแท้', amount: '20g' }
      ],
      images: {
        create: [{ imageUrl: getMappedImage('steakset') }]
      }
    }
  })

  // Store 2: Links to user1's Tom Yum recipe (Case 2)
  await prisma.storePost.create({
    data: {
      userId: store2Id,
      recipeId: tomYumRecipe.id,
      storeName: 'FFlower สวนสมุนไพรและอาหารสด',
      sellingPrice: 150.00,
      storeDescription: 'เซ็ทต้มยำกุ้งน้ำข้นพร้อมปรุง เครื่องสมุนไพรข่า ตะไคร้ ใบมะกรูดสดๆ จากสวน และกุ้งสดตัวใหญ่',
      storeLocation: 'นนทบุรี อำเภอปากเกร็ด',
      contactInfo: 'Line: @fflower_fresh',
      visibility: 'protected',
      setIngredients: [
        { name: 'กุ้งสด', amount: '6 ตัว' },
        { name: 'ชุดสมุนไพรต้มยำ', amount: '1 แพ็ค' }
      ],
      images: {
        create: [{ imageUrl: getMappedImage('tomyumset') }]
      }
    }
  })

  // Store 3: Links to own tom kha recipe (Case 3)
  await prisma.storePost.create({
    data: {
      userId: store3Id,
      recipeId: tomKhaRecipe.id,
      storeName: 'ร้านสะดวกปรุง 6702',
      sellingPrice: 99.00,
      storeDescription: 'ชุดต้มข่าไก่สำเร็จรูป อร่อยเข้มข้นถึงใจ พร้อมกะทิและสมุนไพรแห้ง',
      storeLocation: 'พะเยา อ.เมือง',
      contactInfo: 'โทร: 089-999-9999',
      visibility: 'private',
      setIngredients: [
        { name: 'เนื้อสะโพกไก่หั่นชิ้น', amount: '200g' },
        { name: 'กะทิกล่องพาสเจอร์ไรส์', amount: '250ml' }
      ],
      images: {
        create: [{ imageUrl: getMappedImage('tomkhakaiset') }]
      }
    }
  })

  console.log('✅ 20-recipe percentage seed simulation completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during simulation seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
