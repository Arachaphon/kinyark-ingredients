# แผน: Rewrite สูตรแนะนำ (featured/recommended) ตาม priority tiers

## สเปกจากผู้ใช้ (เรียงความสำคัญ 1→4)
1. สูตรที่ตรงกับ "เมนู" ที่ผู้ใช้ค้นหา → เรียง rating desc, favoriteCount desc
2. สูตรที่ใช้ "วัตถุดิบร่วมกับสูตรที่ผู้ใช้กด favorite"
3. เรตติ้งสูงสุด
4. favorite count สูงสุด

## Root Cause เดิม
- fallback deterministic = top-1 global (ทุกคนได้สูตรเดียว)
- popularity terms (+rating×10 +fav×0.5 +review×0.5) บิดเบือนให้สูตรดังชนะเสมอ
- แคช `__rec_cache__` ติด 3 วัน ไม่มี invalidation เมื่อมี search/favorite ใหม่

## การแก้

### 1. `src/lib/cache.ts`
- export `const REC_CACHE_PREFIX = "__rec_cache__:"` (ย้ายมาจาก featured route)

### 2. `src/app/api/recipes/featured/route.ts`
Rewrite `pickRecommended(user, visibility)` เป็น strict tiers:
```
โหลด: queries (30d, dedupe, len>1), favoriteIds, visibility filter
Tier 1: queries.length > 0 →
  recipe.findMany({
    where: { ...visibility, id: { notIn: [...favoriteIds] }, userId: { not: user.id },
             OR: queries.map(q => ({ recipeName: { contains: q, mode: "insensitive" } })) },
    orderBy: [{ rating: "desc" }, { favoriteCount: "desc" }], take: 1 })
  → ได้ → return id
Tier 2: favoriteIds.length > 0 →
  ingIds = recipeIngredient.findMany({ where: { recipeId: { in: favs } }, select: { ingredientId: true } })
  if ingIds.length > 0 → recipe.findMany({
    where: { ...visibility, id: { notIn: favs }, userId: { not: user.id },
             recipeIngredients: { some: { ingredientId: { in: ingIds } } } },
    orderBy: [{ rating: "desc" }, { favoriteCount: "desc" }], take: 1 }) → return id
Tier 3/4 (fallback): recipe.findMany({ where: visibility,
    orderBy: [{ rating: "desc" }, { favoriteCount: "desc" }], take: 1 }) → return id ?? null
```
- ลบ scoring เก่าทั้งหมด (ingredient-from-search mapping, +20/+30/popularity)
- Anonymous branch: orderBy เปลี่ยนเป็น [{ rating: "desc" }, { favoriteCount: "desc" }] ให้ตรง spec
- import REC_CACHE_PREFIX จาก lib/cache; window 3 วันคงเดิม
- กติกา visibility แยก role (STORE / USER+ADMIN) คงเดิม

### 3. Invalidation เมื่อมีสัญญาณใหม่
- `src/app/api/search/route.ts`: หลังบันทึก SearchHistory ของ user → `prisma.searchHistory.deleteMany({ where: { userId, searchQuery: { startsWith: REC_CACHE_PREFIX } } })`
- `src/app/api/favorites/route.ts`: หลัง toggle สำเร็จ (ทั้ง like/unlike) → deleteMany เหมือนกัน (ใส่ใน invalidateCaches() ที่มีอยู่แล้ว)

### 4. Tests
- `tests/recipes-featured.route.test.ts`: mock เพิ่ม recipeIngredient.findMany, review? ไม่ใช้; อัปเดต assertion orderBy/tier logic; อ่านไฟล์ก่อนแล้วปรับตามจริง
- `tests/favorites.route.test.ts`: เพิ่ม searchHistory.deleteMany mock + expect ถูกเรียก
- search route test (หาไฟล์จริง เช่น tests/search*.test.ts): เพิ่ม deleteMany expectation
- Prisma mock เพิ่ม searchHistory.deleteMany ทุกที่ที่จำเป็น

### 5. Verify
- npx jest tests/recipes-featured.route.test.ts tests/favorites.route.test.ts + suites รีวิวเดิม
- npx tsc --noEmit; eslint ไฟล์ที่แก้
- Live: GET /api/recipes/featured (anon + login user1/user2) ยืนยันได้สูตรต่างกัน/ตรง tier
