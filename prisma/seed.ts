import { Client } from 'pg'
import { readFileSync } from 'fs'

process.loadEnvFile?.('.env')
const envContent = readFileSync('.env', 'utf-8')
const directUrl = process.env.DIRECT_URL || envContent.match(/DIRECT_URL="?([^"\n]+)"?/)?.[1]

if (!directUrl) {
  console.error('❌ DIRECT_URL not found in environment or .env')
  process.exit(1)
}

const CATEGORIES = [
  'Meat',
  'Seafood',
  'Vegetables',
  'Fruits',
  'Kitchen Tools',
  'Grains, Pasta & Baking',
  'Dairy & Eggs',
  'Condiments & Sauces',
  'Spices & Herbs',
  'Nuts & Seeds',
  'Fats & Oils',
  'Liquids & Beverages',
  'Others',
]

const INGREDIENT_SEEDS: { category: string; names: string[] }[] = [
  {
    category: 'Meat',
    names: [
      'ไก่', 'หมู', 'เนื้อวัว', 'เนื้อแกะ', 'เป็ด', 'ไก่งวง', 'เบคอน', 'แฮม', 'ไส้กรอก',
      'เนื้อกวาง', 'เนื้อลูกวัว', 'เนื้อแพะ', 'เปปเปอโรนี', 'ซาลามี', 'พรอสชุตโต', 'นกกระทา',
      'ห่าน', 'วากิวบีฟ', 'หมูสับ', 'เนื้อสับ', 'สามชั้น',
    ],
  },
  {
    category: 'Fruits',
    names: [
      'แอปเปิ้ล', 'กล้วย', 'ส้ม', 'สตรอว์เบอร์รี', 'องุ่น', 'แตงโม', 'มะม่วง',
      'สับปะรด', 'กีวี', 'บลูเบอร์รี', 'ราสพ์เบอร์รี', 'แบล็คเบอร์รี', 'พีช', 'สาลี่',
      'พลัม', 'เชอร์รี', 'มะนาวเหลือง', 'มะนาวเขียว', 'มะพร้าว', 'อะโวคาโด', 'ทับทิม',
      'มะเดื่อ', 'มะละกอ', 'แก้วมังกร', 'ทุเรียน', 'ลิ้นจี่', 'เมลอน',
    ],
  },
  {
    category: 'Seafood',
    names: [
      'กุ้ง', 'ปู', 'แซลมอน', 'ปลาหมึก', 'หอยแมลงภู่', 'กุ้งมังกร', 'ปลาหมึกยักษ์', 'หอยลาย',
      'หอยนางรม', 'ปลาทูน่า', 'ปลาคอด', 'ปลาเทราต์', 'ปลาแมคเคอเรล', 'ปลากะพง', 'ปลาซาร์ดีน',
      'หอยเชลล์', 'เม่นทะเล (อูนิ)', 'ปลาไหล (อูนางิ)', 'คาเวียร์', 'สาหร่าย', 'แมงกะพรุน',
    ],
  },
  {
    category: 'Vegetables',
    names: [
      'ข่าอ่อน', 'มะเขือเทศ', 'แครอท', 'มันฝรั่ง', 'กะหล่ำปลี', 'บรอกโคลี',
      'ผักโขม', 'ผักกาดหอม', 'แตงกวา', 'เห็ด',
      'หน่อไม้ฝรั่ง', 'ซูกินี', 'มะเขือยาว', 'ข้าวโพด', 'ถั่วลันเตา',
      'กะหล่ำดอก', 'ขึ้นฉ่าย', 'เคล', 'ฟักทอง', 'มันเทศ', 'หัวไชเท้า', 'ผักกวางตุ้ง',
    ],
  },
  {
    category: 'Spices & Herbs',
    names: [
      'กระเทียม', 'หัวหอม', 'หอมใหญ่', 'หอมแดง', 'ขิง', 'ตะไคร้', 'ข่า',
      'พริก', 'พริกหยวก', 'พริกขี้หนู', 'พริกชี้ฟ้า', 'พริกไทยดำ', 'พริกไทยขาว', 'พริกป่น',
      'ผงกะหรี่', 'ยี่หร่า', 'ออริกาโน', 'โรสแมรี่', 'ไทม์', 'ใบกะเพรา', 'ใบโหระพา', 'ผักชี',
      'รากผักชี', 'อบเชย', 'โป๊ยกั๊ก', 'กานพลู', 'ปาปริก้า', 'ใบมะกรูด',
    ],
  },
  {
    category: 'Kitchen Tools',
    names: [
      'กระทะ', 'หม้อ', 'เตาอบ', 'เครื่องปั่น', 'แอร์ฟรายเออร์', 'มีด', 'ไมโครเวฟ', 'เครื่องปิ้งขนมปัง',
      'ตะกร้อ', 'กระต่ายขูด', 'ที่ปอกเปลือก', 'เขียงหั่น', 'ถ้วยตวง', 'พาย',
      'คีม', 'ไม้นวดแป้ง', 'หม้อหุงข้าว', 'เครื่องประมวลผลอาหาร', 'เครื่องผสม', 'กระชอน',
    ],
  },
]

async function seed() {
  const client = new Client({ connectionString: directUrl })
  await client.connect()

  console.log('🌱 Seeding categories...')
  try {
    await client.query(`ALTER TABLE "categories" ADD CONSTRAINT "categories_name_key" UNIQUE ("name")`)
  } catch {
    // constraint already exists, ignore
  }

  for (const name of CATEGORIES) {
    await client.query(
      `INSERT INTO "categories" ("name") VALUES ($1) ON CONFLICT ("name") DO NOTHING`,
      [name]
    )
  }

  console.log('🌱 Seeding ingredients...')
  const { rows: catRows } = await client.query(`SELECT id, name FROM "categories"`)
  const catMap: Record<string, number> = {}
  for (const c of catRows) catMap[c.name] = c.id

  let count = 0
  for (const group of INGREDIENT_SEEDS) {
    const categoryId = catMap[group.category]
    if (!categoryId) continue

    for (const name of group.names) {
      await client.query(
        `INSERT INTO "ingredients" ("name", "categoryId")
         VALUES ($1, $2)
         ON CONFLICT ("name") DO UPDATE SET "categoryId" = EXCLUDED."categoryId"`,
        [name, categoryId]
      )
      count++
    }
  }

  console.log(`✅ Seed finished successfully! Processed ${count} ingredients across ${CATEGORIES.length} categories.`)
  await client.end()
}

seed().catch((err) => {
  console.error('❌ Seed error:', err)
  process.exit(1)
})
