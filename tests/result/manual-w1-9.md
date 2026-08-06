# Manual Test Results - W1-9 Manage Ingredients (backend)

> ขอบเขต: backend เท่านั้น ห้ามแก้ไขหน้า frontend/UI และไม่เปลี่ยน logic ฝั่ง UI

## Positive Test Cases

### 1. สร้าง ingredient ใหม่ (POST /api/ingredients)
**ขั้นตอน (Steps):**
1. POST `/api/ingredients` body `{ "name": "ไข่ไก่", "category": "ไข่" }`
2. ถ้า category "ไข่" ยังไม่มีในระบบ จะถูกสร้างขึ้นใหม่

**ผลลัพธ์ที่คาดหวัง (Expected Results):**
- [x] HTTP Status `200 OK` พร้อม `{ data: ingredient }`
- [x] Upsert: ถ้า ingredient ชื่อนี้มีอยู่แล้ว → อัปเดต category; ถ้ายังไม่มี → สร้างใหม่
- [x] category ถูก resolve (find หรือ create)

### 2. ใช้ categoryId ตรง ๆ
- **ขั้นตอน:** POST `/api/ingredients` body `{ "name": "พริก", "categoryId": 5 }`
- **ผลลัพธ์:** `200 OK`, ingredient ผูก categoryId=5 โดยไม่ query category name

### 3. GET รายการ ingredients (คงเดิม) / ค้นหา / filter category
- **ขั้นตอน:** GET `/api/ingredients?category=หมู`, `/api/ingredients?search=ไข`
- **ผลลัพธ์:** `200 OK` ตามเดิม

### 4. แก้ไข ingredient (PATCH /api/ingredients/[id])
- **ขั้นตอน:** PATCH body `{ "name": "ไข่ไก่สด" }` หรือ `{ "category": "โปรตีน" }`
- **ผลลัพธ์:** `200 OK` อัปเดต name/category (resolve category by name ใหม่ได้)

### 5. ลบ ingredient ที่ไม่ได้ถูก recipe ใช้ (DELETE /api/ingredients/[id])
- **ขั้นตอน:** DELETE ingredient id ที่ไม่มี RecipeIngredient อ้างอิง
- **ผลลัพธ์:** `200 OK` `{ data: { success: true, id } }`

---

## Negative Test Cases

### 6. POST ไม่มี name
- **ขั้นตอน:** POST body `{}`
- **ผลลัพธ์:** `400 Bad Request`

### 7. ส่งทั้ง category และ categoryId พร้อมกัน
- **ขั้นตอน:** POST body `{ "name": "X", "category": "A", "categoryId": 1 }`
- **ผลลัพธ์:** `400 Bad Request` "Provide either category name or categoryId, not both"

### 8. PATCH body ว่าง
- **ขั้นตอน:** PATCH body `{}`
- **ผลลัพธ์:** `400 Bad Request` "No fields to update"

### 9. DELETE ingredient ที่ถูก recipe ใช้
- **ขั้นตอน:** DELETE ingredient ที่มี RecipeIngredient.count > 0
- **ผลลัพธ์:** `409 Conflict` พร้อมข้อความ "used in recipes"

### 10. id ไม่ใช่ตัวเลข / ไม่มี ingredient
- **ขั้นตอน:** PATCH/DELETE `/api/ingredients/abc` หรือ id ที่ไม่มี
- **ผลลัพธ์:** `400` (invalid id) / `404 Not Found`

---

## Automated Tests (Jest)
- [x] `tests/ingredients.route.test.ts` - ผ่าน (GET 6 + POST 7)
- [x] `tests/ingredients-id.route.test.ts` - ผ่าน 10 (GET/PATCH/DELETE)
- [x] `npx tsc --noEmit` ผ่าน
- [x] `npx eslint . --max-warnings 0` ผ่าน
- [x] `npm test` ผ่าน (23 suites, 192 passed)