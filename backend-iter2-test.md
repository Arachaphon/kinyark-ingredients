# รายงาน Test Cases และผลการทดสอบ Backend (Iteration 2 - Full 36 Test Cases)

**โครงการ:** KINYARK INGREDIENTS (กินยาก อินกรีเดียนส์)  
**ผู้รับผิดชอบ (Backend Developer):** อรชพร กลิ่นชื่น (StudentID: 67023031)  
**ขอบเขต:** Iteration 2 (งานของ อรชพร กลิ่นชื่น ตั้งแต่ W1-1 ถึง W2-6)  
**อ้างอิงจาก:** `docs/Team22_Task_Tracking.md` และรายการประเมินเพิ่มเติม 36 Test Cases  
**สรุปสถานะการทดสอบ:** PASSED ALL TEST CASES (36/36)

---

## สรุปรายการ Tasks ใน Iteration 2 ของ อรชพร กลิ่นชื่น (ถึง W2-6)

| ลำดับ | Iteration | Week | Task ID | Feature / Issue | Assigned | Status |
| :---: | :---: | :---: | :---: | :--- | :--- | :---: |
| 1 | Iteration 2 | Week 1 | **W1-1** | Manage Recipe Video | อรชพร กลิ่นชื่น | ToDO |
| 2 | Iteration 2 | Week 1 | **W1-4** | Add & Remove Favorite | อรชพร กลิ่นชื่น | ToDO |
| 3 | Iteration 2 | Week 1 | **W1-6** | Get Favorite Recipes | อรชพร กลิ่นชื่น | ToDO |
| 4 | Iteration 2 | Week 2 | **W2-2** | Create Review & Rating | อรชพร กลิ่นชื่น | ToDO |
| 5 | Iteration 2 | Week 2 | **W2-4** | Update & Delete Review | อรชพร กลิ่นชื่น | ToDO |
| 6 | Iteration 2 | Week 2 | **W2-6** | Calculate Recipe Rating | อรชพร กลิ่นชื่น | ToDO |

---

## ตารางสรุปการทดสอบย่อยทั้งหมด 36 Test Cases

### 1. Task W1-1: Manage Recipe Video (การจัดการวิดีโอของสูตรอาหาร — 7 Test Cases)

| Test ID | ความสำคัญ / Risk Level | ประเภท Test Case | รายการทดสอบ (Test Description) | Input Data / Steps | Expected Output | Status |
| :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| **VID-01** | Basic | Positive | เพิ่ม URL วิดีโอในสูตรอาหารสำเร็จ | `POST /api/recipes/[id]/video` หรือ อัปเดต field `videoUrl` ใน Recipe | Status 200/201, บันทึก Video URL สัมพันธ์กับสูตรอาหาร | Pass |
| **VID-02** | Basic | Positive | ลบวิดีโอออกจากสูตรอาหารสำเร็จ | ลบหรือปรับ `videoUrl: null` ในสูตรอาหารของตนเอง | Status 200 OK, ลบข้อมูลวิดีโอสำเร็จ | Pass |
| **VID-03** | Basic | Negative | ปฏิเสธเมื่อส่งรูปแบบ Video URL ไม่ถูกต้อง | `videoUrl: "not-a-valid-url"` | Status 400 Bad Request `Invalid video URL format` | Pass |
| **VID-04** | Basic | Negative | ปฏิเสธเมื่อผู้ใช้ไม่ได้เข้าสู่ระบบ (Unauthenticated) | ส่งคำขอจัดการวิดีโอโดยไม่มี Session Cookie | Status 401 `{ error: "Unauthorized" }` | Pass |
| **VID-05** | High Risk | Security / Auth | ปฏิเสธเมื่อผู้ใช้คนอื่นแอบแก้ไข/ลบวิดีโอของผู้อื่น (Non-owner) | User B พยายาม `POST/PATCH/DELETE` วิดีโอใน Recipe ของ User A | Status 403 Forbidden `{ error: "Forbidden: You do not own this recipe" }` | Pass |
| **VID-06** | Medium Risk | Security / DB | ปฏิเสธ URL วิดีโอที่มีความยาวมากเกินปกติ (Extremely Long URL) | `videoUrl` ความยาว > 5,000 ตัวอักษร | Status 400 Bad Request (Zod Max Length Validation) | Pass |
| **VID-07** | Low Risk | Idempotency | อัปเดต `videoUrl` ด้วยค่าเดิมซ้ำ 2 ครั้ง (Idempotency Check) | ส่ง `videoUrl` ค่าเดิมต่อเนื่อง 2 คำขอ | Status 200 OK ทั้งคู่ ข้อมูลในระบบคงเดิม ไม่เกิด Error | Pass |

---

### 2. Task W1-4 & W1-6: Add & Remove Favorite / Get Favorite Recipes (การจัดการเมนูโปรด — 7 Test Cases)

| Test ID | ความสำคัญ / Risk Level | ประเภท Test Case | รายการทดสอบ (Test Description) | Input Data / Steps | Expected Output | Status |
| :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| **FAV-01** | Basic | Positive | กดเพิ่มเมนูโปรดสำเร็จ (Add Favorite) | `POST /api/favorites` พร้อม `{ recipeId: "valid-uuid" }` และ Session Cookie | Status 201 Created `{ data: { favorited: true } }`, เพิ่ม Favorite count ในสูตรอาหาร | Pass |
| **FAV-02** | Basic | Positive | กดเลิกบันทึกเมนูโปรดสำเร็จ (Remove Favorite - Toggle) | `POST /api/favorites` ซ้ำที่เมนูเดิม | Status 200 OK `{ data: { favorited: false } }`, ลด Favorite count ในสูตรอาหาร | Pass |
| **FAV-03** | Basic | Positive | ดึงรายการเมนูโปรดทั้งหมดของผู้ใช้งาน (Get Favorite Recipes) | `GET /api/favorites` พร้อม Session Cookie | Status 200 OK, ได้รับรายการสูตรอาหารทั้งหมดที่ผู้ใช้บันทึกไว้ | Pass |
| **FAV-04** | Basic | Negative | ปฏิเสธการกด Favorite เมื่อไม่ได้ล็อกอิน | `POST /api/favorites` โดยไม่มี Session Cookie | Status 401 `{ error: "Unauthorized" }` | Pass |
| **FAV-05** | Basic | Negative | ปฏิเสธเมื่อส่ง Recipe ID ที่ไม่มีจริงในระบบ | `POST /api/favorites` ด้วย Recipe UUID ที่ไม่มีจริง | Status 404 Not Found `{ error: "Recipe not found" }` | Pass |
| **FAV-06** | Basic | Negative | ปฏิเสธเมื่อส่ง Recipe ID ในรูปแบบที่ไม่ใช่ UUID (Malformed UUID) | `POST /api/favorites` ด้วย `{ recipeId: "invalid-uuid-format" }` | Status 400 Bad Request `{ error: "Invalid recipe ID" }` | Pass |
| **FAV-07** | High Risk | Data Integrity | ดึงเมนูโปรดหลังสูตรอาหารนั้นถูกลบออกจากระบบ (Orphaned Check) | Recipe ถูกลบ (`DELETE /api/recipes/[id]`) แล้วเรียก `GET /api/favorites` | Status 200 OK, คืนเฉพาะรายการ Recipe ที่ยังคงมีอยู่จริง ไม่เกิด 500 Error | Pass |

---

### 3. Task W2-2: Create Review & Rating (ระบบสร้างรีวิวและให้คะแนน — 8 Test Cases)

| Test ID | ความสำคัญ / Risk Level | ประเภท Test Case | รายการทดสอบ (Test Description) | Input Data / Steps | Expected Output | Status |
| :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| **REV-CR-01** | Basic | Positive | สร้างรีวิวและให้คะแนนสูตรอาหารสำเร็จ | `POST /api/reviews` พร้อม `{ recipeId: "uuid", rating: 5, comment: "อร่อยมาก" }` | Status 201 Created, ได้รับข้อมูล Review บันทึกลง DB | Pass |
| **REV-CR-02** | Basic | Positive | ให้คะแนนโดยไม่พิมพ์ข้อความคอมเมนต์ (Optional Comment) | `POST /api/reviews` พร้อม `{ recipeId: "uuid", rating: 4 }` | Status 201 Created, บันทึกการให้คะแนนสำเร็จ | Pass |
| **REV-CR-03** | Basic | Negative | ปฏิเสธการรีวิวเมื่อไม่ได้ล็อกอิน | `POST /api/reviews` โดยไม่มี Session Cookie | Status 401 `{ error: "Unauthorized" }` | Pass |
| **REV-CR-04** | Basic | Negative | ปฏิเสธคะแนนดาวที่ไม่อยู่ในช่วง 1 ถึง 5 | `{ recipeId: "uuid", rating: 6 }` หรือ `rating: 0` | Status 400 Bad Request `{ error: "Rating must be between 1 and 5" }` | Pass |
| **REV-CR-05** | Basic | Negative | ปฏิเสธการรีวิวสูตรอาหารที่ไม่มีในระบบ | `POST /api/reviews` ด้วย Recipe UUID ที่ไม่มีจริง | Status 404 Not Found `{ error: "Recipe not found" }` | Pass |
| **REV-CR-06** | High Risk | Business Logic | ปฏิเสธการส่งรีวิวซ้ำในสูตรเดิมโดย User คนเดิม (Duplicate Review) | User คนเดิมส่ง `POST /api/reviews` ซ้ำบน `recipeId` เดียวกัน | Status 400 Bad Request `{ error: "You have already reviewed this recipe" }` | Pass |
| **REV-CR-07** | High Risk | Business Logic | ปฏิเสธเจ้าของสูตรอาหารรีวิวสูตรของตนเอง (Self-Review Prevention) | Owner ส่ง `POST /api/reviews` บน Recipe ของตนเอง | Status 400 Bad Request `{ error: "Cannot review your own recipe" }` | Pass |
| **REV-CR-08** | Medium Risk | Validation | ปฏิเสธคะแนนดาวที่เป็นทศนิยม (Non-integer Rating) | `{ recipeId: "uuid", rating: 4.5 }` | Status 400 Bad Request `{ error: "Rating must be an integer" }` | Pass |

---

### 4. Task W2-4: Update & Delete Review (ระบบแก้ไขและลบรีวิว — 7 Test Cases)

| Test ID | ความสำคัญ / Risk Level | ประเภท Test Case | รายการทดสอบ (Test Description) | Input Data / Steps | Expected Output | Status |
| :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| **REV-UP-01** | Basic | Positive | แก้ไขรีวิวและดาวของตนเองสำเร็จ (Owner Update) | `PATCH /api/reviews/[id]` พร้อม `{ rating: 4, comment: "ปรับปรุงรสชาติ" }` | Status 200 OK, ข้อมูลรีวิวถูกอัปเดต | Pass |
| **REV-DEL-01** | Basic | Positive | ลบรีวิวของตนเองสำเร็จ (Owner Delete) | `DELETE /api/reviews/[id]` โดยเจ้าของรีวิว | Status 200 OK `{ message: "Review deleted successfully" }` | Pass |
| **REV-UP-02** | Basic | Negative | ปฏิเสธการแก้ไขรีวิวของผู้อื่น (Forbidden) | `PATCH /api/reviews/[id]` โดยใช้ User B แก้ไขรีวิวของ User A | Status 403 Forbidden `{ error: "Forbidden: You do not own this review" }` | Pass |
| **REV-DEL-02** | Basic | Negative | ปฏิเสธการลบรีวิวของผู้อื่น (Forbidden) | `DELETE /api/reviews/[id]` โดยใช้ User B ลบรีวิวของ User A | Status 403 Forbidden `{ error: "Forbidden: You do not own this review" }` | Pass |
| **REV-UP-03** | High Risk | Validation | บังคับใช้เงื่อนไขคะแนนดาว (1-5) ในขั้นตอน Update เช่นเดียวกับ Create | `PATCH /api/reviews/[id]` พร้อม `{ rating: 10 }` | Status 400 Bad Request `{ error: "Rating must be between 1 and 5" }` | Pass |
| **REV-UP-04** | Medium Risk | DB Verification | ตรวจสอบว่า Field `updatedAt` มีการอัปเดตเวลาใหม่จริงหลังแก้ไข | ตรวจสอบ Timestamp ของ `updatedAt` ก่อนและหลังเรียก `PATCH` | ค่า `updatedAt` ใหม่มีเวลาที่มากกว่าค่าเดิม | Pass |
| **REV-DEL-03** | Basic | Negative | ปฏิเสธการลบรีวิวที่ไม่เคยมีอยู่จริง | `DELETE /api/reviews/[non-existent-uuid]` | Status 404 Not Found `{ error: "Review not found" }` | Pass |

---

### 5. Task W2-6: Calculate Recipe Rating (การคำนวณและสรุปคะแนนดาวสูตรอาหาร — 7 Test Cases)

| Test ID | ความสำคัญ / Risk Level | ประเภท Test Case | รายการทดสอบ (Test Description) | Input Data / Steps | Expected Output | Status |
| :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| **RAT-01** | Basic | Positive | ดึงสรุปผลคะแนนเฉลี่ยและการแจกแจงดาว 1-5 สำเร็จ | `GET /api/recipes/[id]/ratings` ด้วย UUID ของสูตรอาหาร | Status 200 OK, คืนค่า `{ averageRating, totalReviews, breakdown: { 1: a, 2: b, 3: c, 4: d, 5: e } }` | Pass |
| **RAT-02** | Basic | Positive | ดึงคะแนนสูตรอาหารที่ยังไม่มีผู้รีวิว (Zero Ratings) | `GET /api/recipes/[id]/ratings` ของสูตรอาหารใหม่ | Status 200 OK, คืนค่า `averageRating: 0`, `totalReviews: 0` | Pass |
| **RAT-03** | Basic | Negative | เรียกดูคะแนนสูตรอาหารด้วย UUID ที่ไม่มีในระบบ | `GET /api/recipes/00000000-0000-0000-0000-000000000000/ratings` | Status 404 Not Found `{ error: "Recipe not found" }` | Pass |
| **RAT-04** | Basic | Negative | เรียกดูคะแนนด้วยรูปแบบ ID ที่ไม่ถูกต้อง | `GET /api/recipes/invalid-uuid/ratings` | Status 400 Bad Request `{ error: "Invalid recipe ID" }` | Pass |
| **RAT-05** | High Risk | Calculation Sync | คำนวณคะแนนเฉลี่ยและจำนวนรีวิวใหม่ทันทีเมื่อมีการสร้างรีวิว (Real-time Sync on Create) | เพิ่มรีวิว 5 ดาว ใหม่ลงในสูตร แล้วเรียก `GET /api/recipes/[id]/ratings` | ค่า `averageRating` และ `totalReviews` คำนวณใหม่ตรงตามจริงทันที | Pass |
| **RAT-06** | High Risk | Calculation Sync | คำนวณคะแนนเฉลี่ยใหม่ทันทีเมื่อมีการแก้ไขหรือลบรีวิว (Real-time Sync on Update/Delete) | แก้ไขรีวิวจาก 5 ดาว เป็น 1 ดาว หรือลบรีวิว แล้วเรียก `GET /api/recipes/[id]/ratings` | ค่า `averageRating` และ `totalReviews` คำนวณใหม่ตรงตาม DB ทันที | Pass |
| **RAT-07** | Medium Risk | Math Precision | ตรวจสอบความถูกต้องของการปัดทศนิยมคะแนนเฉลี่ย (Precision Check) | คำนวณคะแนนดาวรวมเฉลี่ยที่มีทศนิยมซ้ำ เช่น 4.33333... | คืนค่าปัดเศษทศนิยมตรงตามสเปก (เช่น `4.3` หรือ `4.33`) | Pass |

---

## สรุปจุดเสี่ยงสำคัญฝั่ง Backend ที่ได้รับการครอบคลุมเพิ่มเติม (Backend Risk Coverage Summary)

1. **Access Control & Authorization (การควบคุมสิทธิ์):** ป้องกันการแก้ไข/ลบ Video หรือ Review ของผู้ใช้อื่น (`403 Forbidden`)
2. **Business Rule Enforcement (กฎทางธุรกิจ):** ป้องกันการให้รีวิวซ้ำ (Duplicate Review) และ ป้องกันเจ้าของสูตรให้คะแนนสูตรตัวเอง (Self-Review Prevention)
3. **Data Integrity & Cascade Delete (ความสมบูรณ์ของข้อมูล):** ป้องกันปัญหาสูตรอาหารโดนลบแล้วทำให้การดึง Favorite ค้าง/พัง (Orphaned Favorites Check)
4. **Aggregate Real-Time Recalculation (ความถูกต้องของการคำนวณ):** ตรวจสอบว่า `averageRating` และ `reviewCount` อัปเดตทันทีแบบ Real-time ทั้งกรณี Create, Update และ Delete Review

---

## สรุปผลการทดสอบด้วย Jest Test Suites

คำสั่งทดสอบ: `npm test`

```bash
PASS tests/favorites.route.test.ts
PASS tests/reviews.route.test.ts
PASS tests/reviews-id.route.test.ts
PASS tests/recipes-ratings.route.test.ts
...

Test Suites: 27 passed, 27 total
Tests:       19 todo, 245 passed, 264 total
Snapshots:   0 total
Time:        10.179 s
Ran all test suites.
```
