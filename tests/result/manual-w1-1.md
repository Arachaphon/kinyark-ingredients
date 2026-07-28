# รายงานผลการทดสอบระบบ (Manual Test Results) - w1-1

วันที่ทดสอบ: 28 กรกฎาคม 2026
สถานะโดยรวม: ⏳ **รอการทดสอบ (Pending)**

---

## การทดสอบแบบ Manual (Create Recipe API)
ทดสอบการทำงานของ Backend สำหรับฟังก์ชันสร้างสูตรอาหาร (Create Recipe) โดยผู้ใช้จะทำการตรวจสอบเอง (Manual Test)

- [ ] **1. ล็อกอินเข้าสู่ระบบและเรียก API Create Recipe พร้อม Payload ที่ถูกต้อง**
  - **Expected:** ได้รับ Status 201 และข้อมูล Recipe ที่ถูกสร้าง (รวมถึง Ingredients)
  - **Note:** ตรวจสอบ Database ด้วยว่ามีข้อมูลถูกบันทึกเข้าตารางต่างๆ ครบถ้วน (recipes, ingredients, recipe_ingredients, etc.)

- [ ] **2. เรียก API โดยไม่แนบ Session/Token (ไม่ได้ล็อกอิน)**
  - **Expected:** ได้รับ Status 401 Unauthorized

- [ ] **3. เรียก API โดยแนบ Payload ที่ไม่ครบถ้วน** (เช่น ไม่มี recipeName หรือ ingredients)
  - **Expected:** ได้รับ Status 400 Bad Request พร้อมข้อความ Validation Error จาก Zod
  - **Note:** ทดสอบกรณีไม่มีส่วนผสมอย่างน้อย 1 อย่างเพื่อตรวจสอบ Validation

- [ ] **4. จำลองกรณี Database ขัดข้องก่อนเริ่ม Transaction**
  - **Expected:** ได้รับ Status 500 Internal Server Error

- [ ] **5. จำลองกรณี Database ขัดข้องระหว่างกำลังสร้าง Recipe ภายใน Transaction**
  - **Expected:** ได้รับ Status 500 Internal Server Error และไม่มีข้อมูลใดถูกบันทึก (เกิดการ Rollback)
  - **Note:** ตรวจสอบว่า Ingredients ที่เพิ่งสร้างใหม่ใน Transaction นี้ถูกยกเลิกด้วยหรือไม่
