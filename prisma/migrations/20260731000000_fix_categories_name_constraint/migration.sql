-- Fix: categories.name unique constraint must be non-deferrable
-- PostgreSQL does not allow ON CONFLICT to use a deferrable unique constraint as arbiter,
-- which breaks the idempotent seed script (INSERT ... ON CONFLICT ("name") DO NOTHING).
-- schema.prisma declares `name String @unique` (non-deferrable), so this aligns DB with schema.

ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_name_key";
ALTER TABLE "categories" ADD CONSTRAINT "categories_name_key" UNIQUE ("name");
