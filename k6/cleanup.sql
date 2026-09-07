-- ============================================================
-- k6 cleanup: ลบ recipes ที่สร้างจาก load test (write-heavy)
-- เงื่อนไข: "recipeName" LIKE 'k6-load-%'
--
-- วิธีใช้ (PowerShell):
--   psql $env:DATABASE_URL -f k6/cleanup.sql
-- หรือ dry-run ดูก่อนว่าจะลบกี่แถว:
--   psql $env:DATABASE_URL -c "SELECT count(*) FROM recipes WHERE ""recipeName"" LIKE 'k6-load-%';"
-- (ตารางจริงชื่อ recipes ตาม @@map("recipes") ใน prisma/schema.prisma)
--
-- หมายเหตุ:
--  - ตารางลูกส่วนใหญ่ (RecipeIngredient, EquipmentItem, RecipeImage,
--    RecipeVideo, Rating, Favorite) ตั้ง onDelete: Cascade ไว้แล้ว
--    ลบ Recipe แถวแม่แล้วแถวลูกจะถูกลบตามอัตโนมัติ
--  - StorePost.recipeId เป็น onDelete: SetNull → ถ้ามี store post
--    อ้างถึง recipe ที่ถูกลบ จะกลายเป็น orphan (recipeId=NULL) ไม่ถูกลบ
--    แต่ payload ของ k6/recipes-write-ramp.js ไม่ได้ส่ง `store`
--    จึงไม่มี store post เกิดขึ้นตั้งแต่แรก
-- ============================================================

BEGIN;

-- 1. ดูจำนวนก่อนลบ (จะแสดงใน output ของ psql)
SELECT count(*) AS to_delete
FROM recipes
WHERE "recipeName" LIKE 'k6-load-%';

-- 2. ลบจริง (CASCADE จัดการตารางลูกให้)
DELETE FROM recipes
WHERE "recipeName" LIKE 'k6-load-%';

-- 3. ยืนยันว่าเหลือ 0
SELECT count(*) AS remaining
FROM recipes
WHERE "recipeName" LIKE 'k6-load-%';

COMMIT;
