-- Migration: remove sub_categories, add categoryId directly on ingredients

-- Step 1: Add new column categoryId to ingredients (nullable)
ALTER TABLE "ingredients" ADD COLUMN IF NOT EXISTS "categoryId" INTEGER;

-- Step 2: Add unique constraint to categories.name if not exists
ALTER TABLE "categories" ADD CONSTRAINT "categories_name_key" UNIQUE ("name") DEFERRABLE;

-- Step 3: Migrate existing data — map subCategoryId -> categoryId via sub_categories -> categories
UPDATE "ingredients" i
SET "categoryId" = sc."categoryId"
FROM "sub_categories" sc
WHERE i."subCategoryId" = sc."id"
  AND i."subCategoryId" IS NOT NULL;

-- Step 4: Drop old FK and column subCategoryId
ALTER TABLE "ingredients" DROP CONSTRAINT IF EXISTS "ingredients_subCategoryId_fkey";
ALTER TABLE "ingredients" DROP COLUMN IF EXISTS "subCategoryId";

-- Step 5: Add FK from ingredients.categoryId -> categories.id
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 6: Drop sub_categories table (remove FK first)
ALTER TABLE "sub_categories" DROP CONSTRAINT IF EXISTS "sub_categories_categoryId_fkey";
DROP TABLE IF EXISTS "sub_categories";
