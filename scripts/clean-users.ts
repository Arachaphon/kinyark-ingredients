import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function cleanupUser(userId: string, email: string) {
  console.log(`\n🧹 Starting cleanup for user: ${email} (${userId})`)

  try {
    // 1. Fetch user avatar & recipes media files
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    })

    const recipeImages = await prisma.recipeImage.findMany({
      where: { recipe: { userId } },
      select: { imageUrl: true },
    })

    const recipeVideos = await prisma.recipeVideo.findMany({
      where: { recipe: { userId } },
      select: { videoUrl: true },
    })

    // 2. Clean up Prisma Database records
    await prisma.reviewLike.deleteMany({ where: { userId } })
    await prisma.favorite.deleteMany({ where: { userId } })
    await prisma.searchHistory.deleteMany({ where: { userId } })

    const recipes = await prisma.recipe.findMany({
      where: { userId },
      select: { id: true },
    })
    const recipeIds = recipes.map((r) => r.id)
    if (recipeIds.length > 0) {
      await prisma.reviewLike.deleteMany({
        where: { review: { recipeId: { in: recipeIds } } },
      })
      await prisma.review.deleteMany({
        where: { recipeId: { in: recipeIds } },
      })
      await prisma.favorite.deleteMany({
        where: { recipeId: { in: recipeIds } },
      })
      await prisma.recipeIngredient.deleteMany({
        where: { recipeId: { in: recipeIds } },
      })
      await prisma.recipeEquipment.deleteMany({
        where: { recipeId: { in: recipeIds } },
      })
      await prisma.recipeImage.deleteMany({
        where: { recipeId: { in: recipeIds } },
      })
      await prisma.recipeVideo.deleteMany({
        where: { recipeId: { in: recipeIds } },
      })
      await prisma.storePost.deleteMany({
        where: { recipeId: { in: recipeIds } },
      })
      await prisma.recipe.deleteMany({
        where: { userId },
      })
    }

    await prisma.review.deleteMany({ where: { userId } })
    await prisma.user.deleteMany({ where: { id: userId } })

    // 3. Clean up Supabase Storage Bucket
    const { data: files } = await supabaseAdmin.storage.from('avatars').list(userId)
    if (files && files.length > 0) {
      const filePaths = files.map((f) => `${userId}/${f.name}`)
      await supabaseAdmin.storage.from('avatars').remove(filePaths)
      console.log(`  └─ Deleted ${filePaths.length} files from Storage Bucket (avatars)`)
    }

    // 4. Delete user from Supabase Auth
    const { error: deleteAuthErr } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteAuthErr) {
      console.warn(`  └─ Auth delete warning: ${deleteAuthErr.message}`)
    } else {
      console.log(`  └─ Deleted user from Supabase Auth!`)
    }
  } catch (err) {
    console.error(`❌ Error cleaning up user ${email}:`, err)
  }
}

async function main() {
  const arg = process.argv[2]

  const { data: usersData, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) {
    console.error('Failed to list users:', error)
    return
  }

  const allUsers = usersData.users

  if (arg === '--list') {
    console.log(`📋 Found total ${allUsers.length} account(s) in Supabase Auth:`)
    allUsers.forEach((u) => console.log(` - Email: ${u.email} | ID: ${u.id}`))
    return
  }

  if (arg === '--all-test') {
    // Clean up test emails containing keywords or random mock test emails
    console.log('🔍 Searching for test accounts in Supabase Auth...')

    const testUsers = allUsers.filter((u) => {
      const email = (u.email || '').toLowerCase()
      return (
        email.includes('test') ||
        email.includes('example') ||
        email.includes('demo') ||
        email.includes('temp') ||
        email.includes('user') ||
        email.includes('mock') ||
        email.startsWith('e2e_') ||
        email.endsWith('@test.com') ||
        email.endsWith('@example.com')
      )
    })

    if (testUsers.length === 0) {
      console.log('✨ No test accounts matching criteria found!')
      console.log('Tip: Run "npx tsx scripts/clean-users.ts --list" to inspect all registered emails.')
      return
    }

    console.log(`Found ${testUsers.length} test account(s):`)
    testUsers.forEach((u) => console.log(` - ${u.email}`))

    for (const user of testUsers) {
      await cleanupUser(user.id, user.email || user.id)
    }
  } else if (arg) {
    // Single email cleanup
    const email = arg.trim().toLowerCase()
    console.log(`🔍 Searching for account with email: ${email}`)

    const targetUser = allUsers.find((u) => u.email?.toLowerCase() === email)
    if (!targetUser) {
      console.log(`❌ User with email "${email}" not found!`)
      return
    }

    await cleanupUser(targetUser.id, targetUser.email!)
  } else {
    console.log(`
ℹ️ Usage:
  • List all registered accounts:
    npx tsx scripts/clean-users.ts --list

  • Delete specific email:
    npx tsx scripts/clean-users.ts email@example.com

  • Delete ALL test accounts:
    npx tsx scripts/clean-users.ts --all-test
`)
  }

  await prisma.$disconnect()
}

main()
