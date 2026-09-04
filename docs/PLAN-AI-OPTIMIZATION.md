# แผนการปรับปรุงและเพิ่มประสิทธิภาพ AI API (Kinyark Ingredients)
**หัวข้อ:** การปรับปรุงระบบ AI API รองรับการยิงคู่ขนาน Gemini + Groq โดยไม่ให้โควตาหมดภายใน 2 วัน  
**สถานะ:** รอเริ่มดำเนินการ (Approved Plan)

---

## 1. วัตถุประสงค์ (Goal & Requirement)
* **คงเงื่อนไขหลัก:** ยิงทั้ง **Gemini และ Groq พร้อมกันแบบคู่ขนาน (Concurrent Dual-API)** เพื่อสร้าง 2 สูตรอาหาร/2 สไตล์ ให้ผู้ใช้เลือก
* **แก้ปัญหาต้นเหตุ:**
  1. ลด Input Token ที่บวมจากการยัด 200 เมนูลงใน Prompt (~80% Token Reduction)
  2. แก้ไข Logic การตรวจสอบ Cache ของ Weekly Recommendation ไม่ให้เกิด Infinite API Call Loop เมื่อได้เมนูน้อยกว่า 8 รายการ
  3. ปิด Auto-Revalidate ของ SWR บนหน้าแรกเพื่อป้องกันการยิง API ซ้ำเวลาสลับแท็บ
  4. เพิ่ม Rate Limiting (Throttle) ดักจับสแปมที่ `/api/ai/generate-recipe`

---

## 2. รายละเอียดการปรับปรุงรายไฟล์ (File Changes & Tasks)

### 📌 Task 1: ลดขนาด Prompt ใน `src/lib/ai/ingredient-pair-recipe.ts`
* **ปัญหา:** ฟังก์ชัน `getExistingRecipeNames()` ดึงชื่อเมนูทั้งหมด 200 รายการจาก DB ใส่ Prompt ทำให้เสีย Token ไปกับข้อความเดิม 2,000+ tokens ต่อค่าย ต่อ 1 การค้นหา
* **การแก้ไข:**
  * ปรับ `getExistingRecipeNames()` ให้ดึงเฉพาะตัวอย่างเมนูล่าสุดไม่เกิน 5–8 รายการ หรือเน้นการสั่งใน Prompt ให้ออกแบบเมนูที่มีเอกลักษณ์เฉพาะตัวแทน
  * **ผลลัพธ์:** Input Token ลดลงจาก ~3,500 เหลือ ~400 tokens ต่อ Request (ประหยัด Token ได้ ~85%)

---

### 📌 Task 2: แก้ไข Cache Loop ใน `src/lib/ai/weekly-recommendation.ts`
* **ปัญหา:** โค้ดเดิมเช็ค `if (existing.length >= 8)` หากมี AI ตัวใดตัวหนึ่งเออเร่อและได้เมนูมา 4 รายการ ทุกครั้งที่มีคนเปิดหน้าแรก ระบบจะเข้าใจว่ายังไม่มีข้อมูล และสั่งยิง AI ใหม่อีก 2 ค่ายวนซ้ำไปเรื่อยๆ
* **การแก้ไข:**
  * ปรับเงื่อนไข Cache ให้ตรวจสอบการมีอยู่ของสัปดาห์ปัจจุบัน (`weekKey`) เช่น หากมีข้อมูลของสัปดาห์นั้นแล้ว ให้คืนผลลัพธ์จาก DB ทันที ไม่ยิง AI ซ้ำ
  * แยกการตรวจสอบรายค่าย หากสัปดาห์นั้น Gemini สร้างแล้วแต่ Groq พลาด จะยิงซ่อมเฉพาะ Groq เท่านั้น ไม่ยิง Gemini ซ้ำ

---

### 📌 Task 3: ปิด SWR Revalidation ซ้ำซ้อนที่ Frontend
* **ไฟล์:**
  * `src/app/(main)/page.tsx`
  * `src/app/(main)/home/page.tsx`
  * `src/app/(main)/search/results/page.tsx`
* **การแก้ไข:**
  * ใน `page.tsx` และ `home/page.tsx`: กำหนด options ให้ SWR:
    ```ts
    useSWR("/api/weekly-recommendations", fetcher, {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    });
    ```
  * ใน `search/results/page.tsx`: เพิ่ม Memory Cache / Flag ป้องกันการยิง `POST /api/ai/generate-recipe` ซ้ำใน Session เดียวกันสำหรับวัตถุดิบชุดเดิม

---

### 📌 Task 4: เพิ่ม Rate Limiter บน AI Routes
* **ไฟล์:**
  * `src/lib/rate-limit.ts`
  * `src/app/api/ai/generate-recipe/route.ts`
* **การแก้ไข:**
  * เพิ่มฟังก์ชัน `throttleAiRequest(identifier, minIntervalMs)` ใน `rate-limit.ts`
  * ดักจับคำขอที่ `/api/ai/generate-recipe` จำกัดให้ 1 IP/User ส่งคำขอสร้างสูตรได้ไม่เกิน 1 ครั้ง ต่อ 5-10 วินาที เพื่อป้องกัน Bot หรือการสแปมปุ่มค้นหา

---

## 3. แผนการทดสอบและยืนยันผล (Verification Plan)
1. **Unit Test:** ทดสอบ `npm test` เพื่อให้มั่นใจว่าฟังก์ชันคำนวณและ Rate Limiter ทำงานถูกต้อง
2. **E2E Test:** รัน `npx playwright test tests/e2e/ai-recipe.spec.ts` เพื่อทดสอบว่า API ส่งคืนเมนูจากทั้ง 2 ค่ายได้ครบถ้วน
3. **Manual Check:**
   * ตรวจสอบขนาด Request Payload และ Response Time ใน Network Tab
   * ทดสอบสลับแท็บไปมาในหน้าแรก ยืนยันว่าไม่มีการยิง API ซ้ำ
