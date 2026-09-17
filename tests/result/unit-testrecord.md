# KINYARK INGREDIENTS — UNIT TEST RECORD (ฉบับจัดกลุ่มตามโมดูล)
# บันทึกผลการทดสอบหน่วยย่อย — Module Grouped Report

| หัวข้อ (Field) | รายละเอียด (Detail) |
|---|---|
| Testing Tool | Jest 29.7.0 (preset ts-jest, testEnvironment node) |
| Test Type | Unit Testing (mocked Prisma — ไม่ต่อ database จริง, ไม่ยิง network) |
| Execution Date (วันที่ทดสอบ) | 17/09/2026 |
| Command (คำสั่งที่ใช้) | `npx jest tests/unit --ci --verbose` |
| Test Path | `tests/unit/` (14 ไฟล์) |
| Service Layer | `src/lib/services/*.service.ts` (11 ไฟล์ + `errors.ts`) |
| Environment: Node.js | v24.16.0 |
| Environment: Jest | 29.7.0 |

---

## Test Summary (สรุปผลการทดสอบ)

| Test Suites | Tests | Failed | Todo | Execution Time |
|---|---|---|---|---|
| 14 / 14 Passed | 111 / 111 Passed | 0 | 0 | 8.587 seconds |

```
Test Suites: 14 passed, 14 total
Tests:       111 passed, 111 total
Snapshots:   0 total
Time:        8.587 s
```

- ผลลัพธ์โดยรวม: **PASS** — ไม่มี fail, ไม่มี test.todo ค้าง
- เทสเดิม 35 เคส (validation/proxy/rate-limit) ยังคง PASS เหมือนเดิม ไม่มีการแก้ไข/ลบ
- Raw log ฉบับเต็ม: `tests/result/unit-run-log.txt`

---

## Module Summary (สรุปผลรายโมดูล)

| โมดูล | จำนวนเคส | Pass | Fail | Todo | หมายเหตุ |
|---|---|---|---|---|---|
| Recipe Module (validation + service + UI + detail view) | 24 | 24 | 0 | 0 | validation recipe 12 + recipeService 5 + create-recipe-ui 3 + detail 4 |
| Review Module (validation + service) | 6 | 6 | 0 | 0 | validation review 3 + reviewService 3 (duplicate-block + recalc) |
| Favorite Module (service + rate-limit cooldown) | 3 | 3 | 0 | 0 | add/remove/list; โยง cooldown 2s ใน Security |
| Search Module (validation + service) | 8 | 8 | 0 | 0 | validation search 3 + searchService 5 |
| Ingredient Module (validation) | 7 | 7 | 0 | 0 | ingredient.schema 7 |
| Store Set / Marketplace Module (ใหม่) | 6 | 6 | 0 | 0 | ราคา/ผูก recipe/หมด→private/reject recipeId ปลอม |
| AI Weekly Recommendation Module (ใหม่) | 5 | 5 | 0 | 0 | fallback cached/mock + badge เฉพาะ AI |
| AI Recipe Generation Module (ใหม่) | 5 | 5 | 0 | 0 | daily quota + timeout message |
| Account Deletion Module (ใหม่) | 5 | 5 | 0 | 0 | user.delete + contract Cascade/SetNull ตรง schema |
| Profile Management Module (ใหม่) | 10 | 10 | 0 | 0 | profile-management 7 + userService 3 (รวม delete) |
| Auth & Session Module (schema + UI + context) | 22 | 22 | 0 | 0 | auth.schema 10 + auth UI 6 + auth-context 6 |
| Security / Infrastructure (proxy + rate-limit) | 10 | 10 | 0 | 0 | proxy 5 + rate-limit 5 |
| Not Applicable: Dietary/Allergy, AI Toggle | 0 | 0 | 0 | 0 | ยังไม่ implement (บทที่ 5 ของเล่มจบ) — ไม่เขียนเทสต์ |
| **รวม** | **111** | **111** | **0** | **0** | |

---

## รายละเอียดรายโมดูล

### 1. Recipe Module — 24 passed
- `validation.test.ts` (recipe.schema 12): ชื่อว่าง/ยาวเกิน, ingredients ว่าง, quantity ติดลบ, URL รูป, visibility enum, store validation, systemRecipeId uuid
- `services.test.ts` → recipeService 5 (`src/lib/services/recipe.service.ts`): create คืน record, getById, list แบบ paginated, update/delete พร้อม owner check (403 เมื่อไม่ใช่เจ้าของ, 404 เมื่อไม่มี)
- `create-recipe-ui.test.tsx` 3: USER เข้า Store toggle ไม่ได้ / STORE, ADMIN เข้าได้
- `recipe-detail.test.ts` 4 (`src/lib/services/recipe-detail.service.ts`): มี store post → แสดง banner / ไม่มี → ไม่แสดง / มีแต่ non-public → ไม่แสดง (query กรอง `visibility: "public"`) / recipe ไม่มี → 404

### 2. Review Module — 6 passed
- `validation.test.ts` (review.schema 3): rating 3 ผ่าน / 0 และ 6 reject
- `services.test.ts` → reviewService 3 (`src/lib/services/review.service.ts`): addReview (validate → เช็ก recipe → กันซ้ำ), duplicate → DuplicateError (ตรง 409 ของ POST /api/reviews), recalc rating ปัดทศนิยม 1 ตำแหน่ง (4.25 → 4.3)

### 3. Favorite Module — 3 passed
- `services.test.ts` → favoriteService 3 (`src/lib/services/favorite.service.ts`): add (P2002 → Duplicate), remove (P2025 → NotFound + decrement counter), list เรียงใหม่→เก่า
- เชื่อมกับ Favorite toggle cooldown 2s ที่ทดสอบใน Security/Infrastructure

### 4. Search Module — 8 passed
- `validation.test.ts` (search.schema 3): query ปกติ / ingredientIds / array ผิด type reject
- `services.test.ts` → searchService 5 (`src/lib/services/search.service.ts`): searchByQuery (contains, case-insensitive, เฉพาะ public), searchByIngredients (ต้องมีครบทุก id), save/get/delete history ผ่าน implementation จริง (`searchHistoryService.ts`: trim/dedup, หมดอายุ 1 เดือน, cap 20)

### 5. Ingredient Module — 7 passed
- `validation.test.ts` (ingredient.schema 7): id บวก/ลบ/string, create ต้องมี name, ห้ามส่ง category+categoryId พร้อมกัน, update ห้าม body ว่าง

### 6. Store Set / Marketplace Module — 6 passed (ใหม่)
- `store-set.test.ts` ← `src/lib/services/store-set.service.ts`
- ราคาติดลบ reject / ไม่กรอกราคา reject (storeSchema: sellingPrice required, ≥ 0)
- setIngredients ผูกกับ recipeId ที่มีอยู่จริง (ส่งต่อทั้ง recipeId + setIngredients)
- สินค้าหมด: public → private / non-public (draft) คงเดิม ไม่ update
- recipeId ไม่มีอยู่จริง → NotFoundError (ไม่สร้าง orphan post)

### 7. AI Weekly Recommendation Module — 5 passed (ใหม่)
- `ai-recommendation.test.ts` ← `src/lib/services/ai-recommendation.service.ts`
- AI ล้มเหลว → คืน cached week (fallback: true, ไม่ throw ถึง UI)
- ล้มเหลว + cache ว่าง → คืน built-in mock (FALLBACK_WEEKLY_RECIPES)
- สำเร็จ → คืนผลสด (fallback: false)
- badge "AI Recipe" ติดเฉพาะ isAi/aiProvider รู้จัก (gemini/groq) — ของคนไม่มี badge

### 8. AI Recipe Generation Module — 5 passed (ใหม่)
- `ai-generation.test.ts` ← `src/lib/services/ai-generation.service.ts`
- ภายใต้โควต้า → ok:true, remaining ลด (pattern เดียวกับ rate-limit.test.ts)
- เกินโควต้าวัน (default 20/วัน) → บล็อกพร้อม retryAfterMs + ข้อความไทยชัดเจน, retryable: false
- ขึ้นวันใหม่ → รีเซ็ต (fake timers)
- timeout → AiTimeoutError → ข้อความ "หมดเวลาตอบสนอง กรุณากดลองใหม่" retryable: true (ไม่ crash)
- provider error ทั่วไป → ข้อความกลาง + retryable: true

### 9. Account Deletion Module — 5 passed (ใหม่)
- `account-deletion.test.ts` ← `src/lib/services/account-deletion.service.ts`
- ลบด้วย `user.delete` ครั้งเดียว (cascade เกิดที่ DB — ตรง DELETE /api/auth/delete-account)
- ลบ user ไม่มีอยู่จริง (P2025) → NotFoundError
- Contract test อ่าน `prisma/schema.prisma` จริง: User → Recipe/Review/Favorite/SearchHistory/ReviewLike/StorePost เป็น `onDelete: Cascade` ครบ; `Recipe.referenceRecipeId`, `StorePost.recipeId`, `IngredientPairRecipe.recipeId` เป็น `onDelete: SetNull` (ลบต้นทางไม่ error ได้ null)

### 10. Profile Management Module — 10 passed (ใหม่)
- `profile-management.test.ts` 7 ← `src/lib/services/profile.service.ts`: username ซ้ำ reject (pre-check + P2002), email ผิด format reject, newPassword ไม่มีพิมพ์ใหญ่/ไม่มีอักขระพิเศษ reject (กฎเดียวกับ auth.schema), payload ว่าง reject, update ถูกต้องสำเร็จ, โปรไฟล์ไม่มี → 404
- `services.test.ts` → userService 3 (`src/lib/services/user.service.ts`): get profile / update username-avatar / delete account (cascade)

### 11. Auth & Session Module — 22 passed
- `auth.schema.test.ts` 10: register (email/password กฎ upper/lower/number/special)/login
- `auth.test.tsx` 6: หน้า login/register, รหัสผิด, mismatch, รหัสอ่อน
- `auth-context.test.tsx` 6: session persist, logout sync, race condition, unmount

### 12. Security / Infrastructure — 10 passed
- `proxy.test.ts` 5: กัน spoof x-user-id, ใส่ header เมื่อ JWT valid, ไม่ใส่เมื่อ invalid, redirect protected → /login, public ผ่าน
- `rate-limit.test.ts` 5: first-call ผ่าน, ถี่ไปบล็อก + retryAfterMs, ครบ interval ผ่านอีก, แยก key, cooldown 2s

### 13. Not Applicable — 0 tests (ตามบทที่ 5 ของเล่มจบ)
- ระบบที่ 12 (Dietary/Allergy) — **Not Applicable, Feature not yet implemented**
- ระบบที่ 13 (AI Toggle) — **Not Applicable, Feature not yet implemented**
- เหตุผล: เล่มจบ บทที่ 5 ระบุว่ายังไม่ implement ในเวอร์ชันนี้ จึงไม่เขียนเทสต์ (ไม่นับเป็น Todo/Fail)

---

## Test Files (รายการไฟล์ทดสอบ 14 ไฟล์)

| # | File | Tests | Result |
|---|---|---|---|
| 1 | validation.test.ts | 25 | PASS |
| 2 | proxy.test.ts | 5 | PASS |
| 3 | rate-limit.test.ts | 5 | PASS |
| 4 | auth.schema.test.ts | 10 | PASS |
| 5 | auth.test.tsx | 6 | PASS |
| 6 | auth-context.test.tsx | 6 | PASS |
| 7 | create-recipe-ui.test.tsx | 3 | PASS |
| 8 | services.test.ts (19 todo → เทสจริง, mocked Prisma) | 19 | PASS |
| 9 | store-set.test.ts (ใหม่) | 6 | PASS |
| 10 | ai-recommendation.test.ts (ใหม่) | 5 | PASS |
| 11 | ai-generation.test.ts (ใหม่) | 5 | PASS |
| 12 | account-deletion.test.ts (ใหม่) | 5 | PASS |
| 13 | profile-management.test.ts (ใหม่) | 7 | PASS |
| 14 | recipe-detail.test.ts (ใหม่) | 4 | PASS |

Service layer ใหม่ 12 ไฟล์ใน `src/lib/services/`: errors, recipe, review, favorite, user, search, store-set, ai-recommendation, ai-generation, account-deletion, profile, recipe-detail (+ ใช้ `searchHistoryService.ts` เดิม)

---

## Result (ผลการทดสอบ)

**PASS** — 111/111, Failed 0, Todo 0

---

## หมายเหตุเกี่ยวกับผลแต่ละช่วง (Version History Note)

- **ผลช่วงแรก →** แสดงว่ามีการทดสอบ: baseline เดิม 8 suites / 60 tests + 19 todo
- **ผลช่วงแก้ไข →** ฉบับนี้: implement service layer จริง + เทสใหม่ 6 โมดูล (a–f), แปลง 19 todo เป็นเทสจริงทั้งหมด
- **ผลล่าสุด →** สถานะเวอร์ชันปัจจุบัน: 14 suites / 111 tests PASS (17/09/2026, Node v24.16.0, Jest 29.7.0, Time 8.587s)
- Raw log: `tests/result/unit-run-log.txt`
