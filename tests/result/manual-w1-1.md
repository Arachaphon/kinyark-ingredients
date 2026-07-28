# รายงานผลการทดสอบระบบ (Manual Test Results) - w1-1

วันที่ทดสอบ: 28 กรกฎาคม 2026
สถานะโดยรวม: ⏳ **รอการทดสอบ (Pending)**

---

## 1. การทดสอบแบบ Manual (Create Recipe API)
ทดสอบการทำงานของ Backend สำหรับฟังก์ชันสร้างสูตรอาหาร (Create Recipe)

| ลำดับ | รายการทดสอบ (Test Case) | Expected Result | ผลลัพธ์ | หมายเหตุ |
| :--- | :--- | :--- | :---: | :--- |
| 1 | ล็อกอินเข้าสู่ระบบและเรียก API Create Recipe พร้อม Payload ที่ถูกต้อง | ได้รับ Status 201 และข้อมูล Recipe ที่ถูกสร้าง (รวม Ingredients) | ⏳ | ตรวจสอบ Database ด้วยว่ามีข้อมูลเข้าครบ |
| 2 | เรียก API โดยไม่แนบ Session/Token (ไม่ได้ล็อกอิน) | ได้รับ Status 401 Unauthorized | ⏳ | - |
| 3 | เรียก API โดยแนบ Payload ที่ไม่ครบถ้วน (เช่น ไม่มี recipeName หรือ ingredients) | ได้รับ Status 400 Bad Request พร้อมข้อความ Validation Error จาก Zod | ⏳ | ทดสอบกรณีไม่มีส่วนผสมอย่างน้อย 1 อย่าง |
| 4 | จำลองกรณี Database ขัดข้องก่อนเริ่ม Transaction | ได้รับ Status 500 Internal Server Error | ⏳ | - |
| 5 | จำลองกรณี Database ขัดข้องระหว่างกำลังสร้าง Recipe ภายใน Transaction | ได้รับ Status 500 Internal Server Error และไม่มีข้อมูลใดถูกบันทึก (Rollback) | ⏳ | ตรวจสอบว่า Ingredients ที่สร้างขึ้นจะถูกยกเลิกด้วย |

---

## 2. การทดสอบระดับ Unit & Integration (Jest)
อ้างอิงจากรันไทม์ Auto Tests (`tests/create-recipe.route.test.ts`)

| ลำดับ | รายการทดสอบ (Test Suite) | คำอธิบายสิ่งที่ทดสอบ | ผลลัพธ์ |
| :--- | :--- | :--- | :---: |
| 1 | `create-recipe.route.test.ts` | ทดสอบ 401 Unauthorized เมื่อไม่มี Session | ✅ |
| 2 | `create-recipe.route.test.ts` | ทดสอบ 400 Validation Error เมื่อ Payload ผิดพลาด | ✅ |
| 3 | `create-recipe.route.test.ts` | ทดสอบ 201 Successful Creation สร้าง Recipe ได้ถูกต้อง พร้อม mock Transaction | ✅ |
| 4 | `create-recipe.route.test.ts` | ทดสอบ 500 Database Failure ก่อนเข้า Transaction | ✅ |
| 5 | `create-recipe.route.test.ts` | ทดสอบ 500 Transaction Rollback เมื่อเกิดข้อผิดพลาดด้านใน Transaction | ✅ |

---

## 3. สรุปผลการทดสอบทั้งหมด

| ประเภท | จำนวน Suites | จำนวน Tests | ผลลัพธ์ |
| :--- | :---: | :---: | :---: |
| Manual Tests | 1 | 5 | ⏳ Pending |
| Jest Unit & Integration | 1 | 5 | ✅ Passed |
| **รวมทั้งหมด** | **2** | **10** | ⏳ |
