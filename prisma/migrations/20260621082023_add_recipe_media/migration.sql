/*
  Warnings:

  - You are about to drop the column `created_at` on the `favorites` table. All the data in the column will be lost.
  - You are about to drop the column `recipe_id` on the `favorites` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `favorites` table. All the data in the column will be lost.
  - You are about to drop the column `sub_category_id` on the `ingredients` table. All the data in the column will be lost.
  - You are about to drop the column `ingredient_id` on the `recipe_ingredients` table. All the data in the column will be lost.
  - You are about to drop the column `recipe_id` on the `recipe_ingredients` table. All the data in the column will be lost.
  - You are about to drop the column `ai_provider` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `bg_color` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `favorite_count` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `featured_image_url` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `recipe_name` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `review_count` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `review_likes` table. All the data in the column will be lost.
  - You are about to drop the column `review_id` on the `review_likes` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `review_likes` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `is_anonymous` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `recipe_id` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `search_histories` table. All the data in the column will be lost.
  - You are about to drop the column `search_query` on the `search_histories` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `search_histories` table. All the data in the column will be lost.
  - You are about to drop the column `category_id` on the `sub_categories` table. All the data in the column will be lost.
  - You are about to drop the column `avatar_url` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,recipeId]` on the table `favorites` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[recipeId,ingredientId]` on the table `recipe_ingredients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reviewId,userId]` on the table `review_likes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `recipeId` to the `favorites` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `favorites` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ingredientId` to the `recipe_ingredients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipeId` to the `recipe_ingredients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipeName` to the `recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reviewId` to the `review_likes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `review_likes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipeId` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `searchQuery` to the `search_histories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `search_histories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `sub_categories` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_recipe_id_fkey";

-- DropForeignKey
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_user_id_fkey";

-- DropForeignKey
ALTER TABLE "ingredients" DROP CONSTRAINT "ingredients_sub_category_id_fkey";

-- DropForeignKey
ALTER TABLE "recipe_ingredients" DROP CONSTRAINT "recipe_ingredients_ingredient_id_fkey";

-- DropForeignKey
ALTER TABLE "recipe_ingredients" DROP CONSTRAINT "recipe_ingredients_recipe_id_fkey";

-- DropForeignKey
ALTER TABLE "recipes" DROP CONSTRAINT "recipes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "review_likes" DROP CONSTRAINT "review_likes_review_id_fkey";

-- DropForeignKey
ALTER TABLE "review_likes" DROP CONSTRAINT "review_likes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_recipe_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_user_id_fkey";

-- DropForeignKey
ALTER TABLE "search_histories" DROP CONSTRAINT "search_histories_user_id_fkey";

-- DropForeignKey
ALTER TABLE "sub_categories" DROP CONSTRAINT "sub_categories_category_id_fkey";

-- DropIndex
DROP INDEX "favorites_user_id_recipe_id_key";

-- DropIndex
DROP INDEX "recipe_ingredients_recipe_id_ingredient_id_key";

-- DropIndex
DROP INDEX "review_likes_review_id_user_id_key";

-- AlterTable
ALTER TABLE "favorites" DROP COLUMN "created_at",
DROP COLUMN "recipe_id",
DROP COLUMN "user_id",
ADD COLUMN     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "recipeId" UUID NOT NULL,
ADD COLUMN     "userId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "ingredients" DROP COLUMN "sub_category_id",
ADD COLUMN     "subCategoryId" INTEGER;

-- AlterTable
ALTER TABLE "recipe_ingredients" DROP COLUMN "ingredient_id",
DROP COLUMN "recipe_id",
ADD COLUMN     "ingredientId" INTEGER NOT NULL,
ADD COLUMN     "recipeId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "ai_provider",
DROP COLUMN "bg_color",
DROP COLUMN "created_at",
DROP COLUMN "favorite_count",
DROP COLUMN "featured_image_url",
DROP COLUMN "recipe_name",
DROP COLUMN "review_count",
DROP COLUMN "user_id",
ADD COLUMN     "aiProvider" TEXT,
ADD COLUMN     "bgColor" TEXT,
ADD COLUMN     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "favoriteCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "recipeName" TEXT NOT NULL,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "userId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "review_likes" DROP COLUMN "created_at",
DROP COLUMN "review_id",
DROP COLUMN "user_id",
ADD COLUMN     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "reviewId" UUID NOT NULL,
ADD COLUMN     "userId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "created_at",
DROP COLUMN "is_anonymous",
DROP COLUMN "recipe_id",
DROP COLUMN "user_id",
ADD COLUMN     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recipeId" UUID NOT NULL,
ADD COLUMN     "userId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "search_histories" DROP COLUMN "created_at",
DROP COLUMN "search_query",
DROP COLUMN "user_id",
ADD COLUMN     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "searchQuery" TEXT NOT NULL,
ADD COLUMN     "userId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "sub_categories" DROP COLUMN "category_id",
ADD COLUMN     "categoryId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "avatar_url",
DROP COLUMN "created_at",
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "recipe_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipeId" UUID NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_videos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipeId" UUID NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_recipeId_key" ON "favorites"("userId", "recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_ingredients_recipeId_ingredientId_key" ON "recipe_ingredients"("recipeId", "ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "review_likes_reviewId_userId_key" ON "review_likes"("reviewId", "userId");

-- AddForeignKey
ALTER TABLE "sub_categories" ADD CONSTRAINT "sub_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "sub_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_images" ADD CONSTRAINT "recipe_images_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_videos" ADD CONSTRAINT "recipe_videos_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_histories" ADD CONSTRAINT "search_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_likes" ADD CONSTRAINT "review_likes_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_likes" ADD CONSTRAINT "review_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
