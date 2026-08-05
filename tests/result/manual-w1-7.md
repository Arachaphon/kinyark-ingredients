# Manual Test Results - W1-7 Delete Recipe (DELETE)

## Positive Test Cases

### 1. ลบสูตรอาหารโดยเจ้าของสูตร (Recipe Owner)
**ขั้นตอน (Steps):**
1. เข้าสู่ระบบด้วยบัญชีที่เป็นเจ้าของสูตร
2. ไปที่หน้า "สูตรอาหารของฉัน" (My Recipe)
3. เลือกสูตรที่ต้องการลบ แล้วกดปุ่มลบ
4. ยืนยันการลบ

**ผลลัพธ์ที่คาดหวัง (Expected Results):**
- [x] ส่งคำขอด้วย Method `DELETE` ไปยัง `/api/recipes/[id]` โดยใช้ recipe ID ที่ถูกต้อง
- [x] ระบบคืน HTTP Status `200 OK` พร้อม `{ data: { success: true, id } }`
- [x] สูตรถูกลบออกจากฐานข้อมูลพร้อมความสัมพันธ์ทั้งหมด (ingredients, images, videos, store posts, reviews, favorites)
- [x] ไฟล์รูปภาพ/วิดีโอของสูตรและของ store post ถูกลบออกจาก Supabase Storage

### 2. ลบสูตรที่มี Store Post (เซ็ทอาหาร) ผูกอยู่
**ขั้นตอน (Steps):**
1. เตรียมสูตรที่มี store post (มีรูป/วิดีโอของ store post)
2. ลบสูตรด้วย API
3. ตรวจสอบว่า store post และไฟล์ media ของมันถูกลบด้วย

**ผลลัพธ์ที่คาดหวัง (Expected Results):**
- [x] HTTP Status `200 OK`
- [x] store post (ตาราง store_posts) ถูกลบ (cascade จาก store_post_images / store_post_videos)
- [x] ไฟล์รูป/วิดีโอของ store post ถูก deleteFileByUrl ลบจาก bucket `recipes`

---

## Negative Test Cases

### 3. ลบสูตรโดยไม่เข้าสู่ระบบ (Unauthenticated)
**ขั้นตอน (Steps):**
1. เรียก `DELETE /api/recipes/[id]` โดยไม่มี session

**ผลลัพธ์ที่คาดหวัง (Expected Results):**
- [x] HTTP Status `401 Unauthorized`
- [x] ไม่มีการลบข้อมูลในฐานข้อมูล

### 4. ส่ง recipe ID ที่ไม่ใช่ UUID (Invalid ID)
**ขั้นตอน (Steps):**
1. เรียก `DELETE /api/recipes/not-a-uuid`

**ผลลัพธ์ที่คาดหวัง (Expected Results):**
- [x] HTTP Status `400 Bad Request` พร้อม `{ error: "Invalid recipe ID" }`
- [x] ไม่มีการ query/ลบข้อมูล

### 5. ลบสูตรที่ไม่มีอยู่ (Not Found)
**ขั้นตอน (Steps):**
1. เรียก `DELETE /api/recipes/<uuid ที่ไม่มีในระบบ>`

**ผลลัพธ์ที่คาดหวัง (Expected Results):**
- [x] HTTP Status `404 Not Found`

### 6. ลบสูตรของคนอื่น (Forbidden)
**ขั้นตอน (Steps):**
1. เข้าสู่ระบบด้วยบัญชี A
2. เรียก `DELETE /api/recipes/<uuid สูตรของบัญชี B>`

**ผลลัพธ์ที่คาดหวัง (Expected Results):**
- [x] HTTP Status `403 Forbidden`
- [x] ไม่มีการลบข้อมูลของสูตรคนอื่น

---

## Automated Tests (Jest)
- [x] `tests/recipes-id.route.test.ts` - ผ่าน 13 tests (6 DELETE cases: 401, 400, 404, 403, success + media cleanup, 500)
- [x] `npx tsc --noEmit` ผ่าน
- [x] `npx eslint . --max-warnings 0` ผ่าน
- [x] `npm test` ผ่าน (22 suites, 175 passed)
