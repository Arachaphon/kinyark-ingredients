-- AlterTable
ALTER TABLE "ingredients" ADD COLUMN     "discount" DOUBLE PRECISION,
ADD COLUMN     "role" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER';
