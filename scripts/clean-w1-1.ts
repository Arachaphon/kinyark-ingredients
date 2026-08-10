import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import { extractPathFromPublicUrl } from '../src/lib/storage'

const prisma = new PrismaClient()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('🔍 Searching for test recipe "สูตรอาหารทดสอบระบบวิดีโอ"...')

  const recipes = await prisma.recipe.findMany({
    where: {
      recipeName: {
        contains: 'สูตรอาหารทดสอบระบบวิดีโอ',
      },
    },
    include: {
      images: true,
      videos: true,
      storePosts: {
        include: {
          images: true,
          videos: true,
        },
      },
    },
  })

  if (recipes.length === 0) {
    console.log('✨ No test recipes found with that name.')
    await prisma.$disconnect()
    return
  }

  console.log(`📋 Found ${recipes.length} test recipe(s) to clean up.`)

  for (const recipe of recipes) {
    console.log(`\n🧹 Cleaning up recipe: "${recipe.recipeName}" (${recipe.id})`)

    // 1. Gather all files to delete from Storage (recipes bucket)
    const urlsToDelete: string[] = []

    // Recipe images & videos
    recipe.images.forEach((img) => urlsToDelete.push(img.imageUrl))
    recipe.videos.forEach((vid) => urlsToDelete.push(vid.videoUrl))

    // Store post images & videos
    recipe.storePosts.forEach((sp) => {
      sp.images.forEach((img) => urlsToDelete.push(img.imageUrl))
      sp.videos.forEach((vid) => urlsToDelete.push(vid.videoUrl))
    })

    const uniqueUrls = Array.from(new Set(urlsToDelete))
    console.log(`  └─ Found ${uniqueUrls.length} file(s) in Supabase Storage to delete.`)

    for (const url of uniqueUrls) {
      const path = extractPathFromPublicUrl(url, 'recipes')
      if (path) {
        console.log(`     removing storage file: recipes/${path}`)
        const { error } = await supabaseAdmin.storage.from('recipes').remove([path])
        if (error) {
          console.error(`     ❌ Error removing storage file: ${error.message}`)
        } else {
          console.log(`     ✅ Removed successfully`)
        }
      }
    }

    // 2. Delete recipe (this will cascade delete recipeIngredients, recipeEquipment, recipeImages, recipeVideos, favorites, etc.)
    // Note: StorePost has onDelete: SetNull or Cascade. Let's delete StorePost manually first just to be safe.
    await prisma.storePost.deleteMany({
      where: { recipeId: recipe.id }
    })

    await prisma.recipe.delete({
      where: { id: recipe.id },
    })
    console.log(`  └─ Deleted recipe and all associated relations from database!`)
  }

  console.log('\n✅ Cleanup complete!')
  await prisma.$disconnect()
}

main()
