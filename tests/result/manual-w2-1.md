# Manual Test Results - W2-1 Validate Recipe Data

## Positive Test Cases

### 1. ข ้อมูล recipe ที่ถูกต้องผ่าน validation
- **ขั้นตอน:** POST/PATCH `/api/recipes` body `{ recipeName, ingredients: [{name, quantity, unit}], ... }` ข้อมูลครบถูกต้อง
- **ผลลัพธ์:** ผ่าน `createRecipeSchema` validation (200 ต่อเนื่องเป็น API)

### 2. featuredImageUrl เป็น URL ที่ถูกต้อง
- **ขั้นตอน:** ส่ง `featuredImageUrl: "https://example.com/img.jpg"`
- **ผลลัพธ์:** ผ่าน validation

### 3. update ข้อมูลบาง field (PATCH)
- **ขั้นตอน:** PATCH เฉพาะ `{ description }` หรือ `{ visibility }`
- **ผลลัพธ์:** `updateRecipeSchema` ยอมรับ partial

---

## Negative Test Cases

### 4. recipeName ว่าง
- **ขั้นตอน:** ส่ง `recipeName: ""`
- **ผลลัพธ์:** `400 Bad Request`

### 5. recipeName ยาวเกิน (ขอบเขตเพิ่ม)
- **ขั้นตอน:** ส่ง `recipeName` ยาว 151 ตัวอักษร
- **ผลลัพธ์:** reject (max 150)

### 6. featuredImageUrl ไม่ใช่ URL
- **ขั้นตอน:** ส่ง `featuredImageUrl: "not-a-url"`
- **ผลลัพธ์:** reject

### 7. ingredients ว่าง
- **ขั้นตอน:** ส่ง `ingredients: []`
- **ผลลัพธ์:** reject ("add at least one ingredient")

### 8. quantity ติดลบ
- **ขั้นตอน:** ส่ง `ingredients: [{ name, quantity: -1, unit }]`
- **ผลลัพธ์:** reject

### 9. visibility ไม่อยู่ใน enum
- **ขั้นตอน:** ส่ง `visibility: "secret"`
- **ผลลัพธ์:** reject

### 10. store sellingPrice ติดลบ / storeName ว่าง
- **ขั้นตอน:** `store: { storeName: "", sellingPrice: -5 }`
- **ผลลัพธ์:** reject

### 11. systemRecipeId / referenceRecipeId ไม่ใช่ UUID
- **ขั้นตอน:** ส่ง `systemRecipeId: "nope"`
- **ผลลัพธ์:** reject

---

## Automated Tests (Jest)
- [x] `tests/validation.test.ts` - ผ่าน 25 tests (เพิ่ม recipe/ingredient edge cases)
- [x] `npx tsc --noEmit` ผ่าน
- [x] `npx eslint . --max-warnings 0` ผ่าน
- [x] `npm test` ผ่าน (23 suites, 204 passed)