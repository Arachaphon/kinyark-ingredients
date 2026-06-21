/*
  Warnings:

  - Added the required column `quantity` to the `recipe_ingredients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `recipe_ingredients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "recipe_ingredients" ADD COLUMN     "quantity" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "unit" TEXT NOT NULL;
