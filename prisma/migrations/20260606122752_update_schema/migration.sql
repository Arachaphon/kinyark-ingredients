/*
  Warnings:

  - You are about to drop the column `quantity` on the `recipe_ingredients` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `recipe_ingredients` table. All the data in the column will be lost.
  - You are about to drop the column `video_url` on the `recipes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "recipe_ingredients" DROP COLUMN "quantity",
DROP COLUMN "unit";

-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "video_url";
