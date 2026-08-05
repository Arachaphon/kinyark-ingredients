# Manual Test Results - W2-4 Upload Recipe Image (POST /api/recipes/upload)

## Positive Test Cases

### 1. อัปโหลดรูปภาพ (image/jpeg, png, webp)
- **ขั้นตอน:** POST `/api/recipes/upload` (multipart/form-data) field `file`
- **ผลลัพธ์:**
  - [x] ผ่าน `validateImageFile` + `validateImageSignature` (magic bytes)
  - [x] HTTP Status `200` พร้อม `{ url: ... }` ที่เป็น public url ใน bucket `recipes`
  - [x] path ถูก generate เป็น `<userId>/<uuid>.<ext>`

### 2. อัปโหลดวิดีโอ (mp4, mov, webm)
- **ขั้นตอน:** POST file `type: video/*`
- **ผลลัพธ์:** [x] `200` พร้อม public url (ผ่าน `validateVideoFile`)

---

## Negative Test Cases

### 3. ไม่ได้เข้าสู่ระบบ
- **ขั้นตอน:** POST โดยไม่มี session
- **ผลลัพธ์:** [x] `401 Unauthorized`

### 4. ไม่มีไฟล์แนบ
- **ขั้นตอน:** POST โดยไม่มี field `file`
- **ผลลัพธ์:** [x] `400 No file provided`

### 5. type ไฟล์ไม่ถูก (ไม่ใช่ image/video ที่รองรับ)
- **ขั้นตอน:** ส่ง `.txt` / mime ไม่ตรง
- **ผลลัพธ์:** [x] `400 Invalid file type`

### 6. ไฟล์ใหญ่เกิน (ภาพ >5MB / วิดีโอ >50MB)
- **ขั้นตอน:** URL ไฟล์เกินขนาด
- **ผลลัพธ์:** [x] `413 File too large`

### 7. เนื้อไฟล์ไม่ตรงกับ typedef (signature mismatch)
- **ขั้นตอน:** ไฟล์ที่ชั่วหาย file header ไม่ตรง
- **ผลลัพธ์:** [x] `400 File content does not match`

### 8. Storage upload ผิดพลาด
- **ขั้นตอน:** bucket ไม่พร้อม / upload fail
- **ผลลัพธ์:** [x] `502 Storage error`

### 9. type ที่ไม่รองรับ (ไม่ map เป็น extension)
- **ขั้นตอน:** ส่ง mime ที่ unknown
- **ผลลัพธ์:** [x] `400 Unsupported file type`

---

## Automated Tests (Jest)
- [x] `tests/recipes-upload.route.test.ts` - ผ่าน 9 tests (401/400/413/400/502/200/200/...)
- [x] `npx tsc --noEmit` ผ่าน
- [x] `npx eslint . --max-warnings 0` ผ่าน
- [x] `npm test` ผ่าน (24 suites, 213 passed)