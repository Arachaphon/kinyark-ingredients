# รายงานผลการทดสอบระบบ (Test Results)

วันที่ทดสอบ: 18 กรกฎาคม 2026
สถานะโดยรวม: ✅ **ผ่านทั้งหมด (All Passed)**

---

## 1. การทดสอบแบบ End-to-End (E2E) ด้วย Playwright
จำลองพฤติกรรมการใช้งานจริงของ User บนเบราว์เซอร์

| ลำดับ | รายการทดสอบ (Test Case) | ไฟล์ที่ทดสอบ | ผลลัพธ์ | หมายเหตุ |
| :--- | :--- | :--- | :---: | :--- |
| 1 | สมัครสมาชิกสำเร็จ, ล็อกอินสำเร็จ, และโดนดีดออกจากหน้า Protected หากล็อกเอาต์ | `tests/e2e/auth.spec.ts` | ✅ | คลุม Flow หลักของระบบครบถ้วน |
| 2 | สมัครสมาชิกด้วยอีเมลซ้ำ จะต้องแสดงข้อความ Error จาก Server | `tests/e2e/auth.spec.ts` | ✅ | ตรวจสอบการพ่น Error ฝั่ง Server (Duplicated) |
| 3 | ล็อกอินด้วยรหัสผ่านผิด จะต้องแสดงข้อความ Error ให้ผู้ใช้ทราบ | `tests/e2e/auth.spec.ts` | ✅ | - |

> **หมายเหตุ Playwright:** หากในอนาคตมีเคสไหนรันแล้วไม่ผ่าน (❌) ระบบจะบันทึก **ภาพหน้าจอ, วิดีโอ, และ Trace** เก็บไว้ให้โดยอัตโนมัติ (สามารถเปิดดูได้ผ่าน `npx playwright show-report`)

---

## 2. การทดสอบระดับ Unit & Integration (Jest)
ทดสอบการทำงานของ Components, ฟังก์ชัน Validation, และ API Route

| ลำดับ | รายการทดสอบ (Test Suite) | คำอธิบายสิ่งที่ทดสอบ | ผลลัพธ์ |
| :--- | :--- | :--- | :---: |
| 1 | `auth.test.tsx` | ทดสอบการเรนเดอร์หน้าจอ Login/Register และฟอร์มว่าแสดงผลและจับ Error ถูกต้อง | ✅ |
| 2 | `auth.schema.test.ts` | ตรวจสอบ Zod Schema (รหัสผ่านสั้นไป, ไม่มีพิมพ์ใหญ่, รูปแบบอีเมลผิด, ฯลฯ) | ✅ |
| 3 | `login.api.test.ts` | จำลอง API Endpoint `/api/auth/login` และเช็คการประมวลผลของ Backend | ✅ |
| 4 | `register.api.test.ts` | จำลอง API Endpoint `/api/auth/register` และเช็คการบันทึกลง Database (Prisma) | ✅ |
| 5 | `delete-account.api.test.ts` | จำลอง API ยกเลิกบัญชี (เช็คการลบข้อมูล Prisma/Supabase) | ✅ |
| 6 | `logout.api.test.ts` | ทดสอบ API Endpoint ในการเคลียร์ Session | ✅ |
| 7 | `middleware.test.ts` | ทดสอบสิทธิ์การเข้าถึงหน้าเว็บ (สกัดคนล็อกเอาต์ไม่ให้เข้า `/home`) | ✅ |
| 8 | `login.test.ts` / `logout.test.ts` / `register.test.ts` | ทดสอบ Server Actions พื้นฐานต่างๆ ของระบบ | ✅ |
| 9 | `services.test.ts` | ทดสอบ Service layer แยกต่างหาก | ✅ |
| 10 | `validation.test.ts` | ทดสอบ Utils/Helpers สำหรับ Validation เพิ่มเติม | ✅ |

*สถิติ Jest ล่าสุด: รันทั้งหมด 12 Test Suites (รวมทั้งหมด 103 Tests) - ✅ ผ่านทุกเคส*
