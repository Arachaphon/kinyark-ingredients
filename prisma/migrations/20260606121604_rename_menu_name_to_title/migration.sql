/*
  Warnings:

  - You are about to drop the column `menu_name` on the `recipes` table. All the data in the column will be lost.
  - Added the required column `recipe_name` to the `recipes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "menu_name",
ADD COLUMN     "recipe_name" TEXT NOT NULL;
