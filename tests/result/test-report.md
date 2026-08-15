# รายงานผลการทดสอบระบบ (Test Results)

วันที่ทดสอบ: 20 กรกฎาคม 2026
สถานะโดยรวม: ✅ **ผ่านทั้งหมด (All Passed)**

---

## 1. การทดสอบแบบ End-to-End (E2E) ด้วย Playwright
จำลองพฤติกรรมการใช้งานจริงของ User บนเบราว์เซอร์

| ลำดับ | รายการทดสอบ (Test Case) | ไฟล์ที่ทดสอบ | ผลลัพธ์ | หมายเหตุ |
| :--- | :--- | :--- | :---: | :--- |
| 1 | สมัครสมาชิกสำเร็จ, ล็อกอินสำเร็จ, และโดนดีดออกจากหน้า Protected หากล็อกเอาต์ | `tests/e2e/auth.spec.ts` | ✅ | คลุม Flow หลักของระบบครบถ้วน |
| 2 | สมัครสมาชิกด้วยอีเมลซ้ำ จะต้องแสดงข้อความ Error จาก Server | `tests/e2e/auth.spec.ts` | ✅ | ตรวจสอบการพ่น Error ฝั่ง Server (Duplicated) |
| 3 | ล็อกอินด้วยรหัสผ่านผิด จะต้องแสดงข้อความ Error ให้ผู้ใช้ทราบ | `tests/e2e/auth.spec.ts` | ✅ | - |
| 4 | แสดงโปรไฟล์ผู้ใช้ใน SettingModal หลังล็อกอิน (คลิก Avatar → เช็ก Username/Email) | `tests/e2e/profile.spec.ts` | ✅ | - |
| 5 | เรียก `/api/auth/me` โดยไม่มี Session → ต้องได้ 401 | `tests/e2e/profile.spec.ts` | ✅ | - |
| 6 | เรียก `/api/auth/me` พร้อม Session → ต้องได้ 200 + user data ถูกต้อง | `tests/e2e/profile.spec.ts` | ✅ | - |

> **หมายเหตุ Playwright:** หากมีเคสไหนรันแล้วไม่ผ่าน (❌) ระบบจะบันทึก **ภาพหน้าจอ, วิดีโอ, และ Trace** เก็บไว้ให้โดยอัตโนมัติ (สามารถเปิดดูได้ผ่าน `npx playwright show-report`)

---

## 2. การทดสอบระดับ Unit & Integration (Jest)
ทดสอบการทำงานของ Components, ฟังก์ชัน Validation, Zod Schema, Server Actions, และ API Route

### 2a. ระบบ Authentication (Auth)

| ลำดับ | รายการทดสอบ (Test Suite) | คำอธิบายสิ่งที่ทดสอบ | ผลลัพธ์ |
| :--- | :--- | :--- | :---: |
| 1 | `auth.test.tsx` | ทดสอบการเรนเดอร์หน้าจอ Login/Register และฟอร์มว่าแสดงผลและจับ Error ถูกต้อง | ✅ |
| 2 | `auth.schema.test.ts` | ตรวจสอบ Zod Schema (รหัสผ่านสั้นไป, ไม่มีพิมพ์ใหญ่, รูปแบบอีเมลผิด, ฯลฯ) | ✅ |
| 3 | `auth-context.test.tsx` | ทดสอบ AuthContext: session persistence, Logout, Unsubscribe ไม่มี memory leak | ✅ |
| 4 | `login.test.ts` + `login.api.test.ts` | จำลอง Server Action login: validation, user lookup, Supabase signIn, redirect | ✅ |
| 5 | `register.test.ts` + `register.api.test.ts` | จำลอง Server Action register: validation, duplicate check, Prisma create, role mapping | ✅ |
| 6 | `logout.test.ts` + `logout.api.test.ts` | จำลอง API Logout: เคลียร์ Session และ redirect | ✅ |
| 7 | `delete-account.api.test.ts` | จำลอง API ยกเลิกบัญชี: เช็ครหัสผ่าน, cascade data, ลบ Prisma + Supabase Admin | ✅ |

### 2b. ระบบ Authorization & Protected Routes

| ลำดับ | รายการทดสอบ (Test Suite) | คำอธิบายสิ่งที่ทดสอบ | ผลลัพธ์ |
| :--- | :--- | :--- | :---: |
| 8 | `middleware.test.ts` | ทดสอบ Next.js Middleware: ป้องกันหน้า `/home`, `/create-recipe` ถ้าไม่ล็อกอิน, redirect `/login` → `/home` ถ้าล็อกอินแล้ว | ✅ |

### 2c. ระบบ Profile (w2-3 Get Profile) — เพิ่มใหม่

| ลำดับ | รายการทดสอบ (Test Suite) | คำอธิบายสิ่งที่ทดสอบ | จำนวนเคส | ผลลัพธ์ |
| :--- | :--- | :--- | :---: | :---: |
| 9 | `auth-me.route.test.ts` | `GET /api/auth/me`: 200, 401 (null user + error), 404, 500, sensitive data leak, select object | 7 | ✅ |
| 10 | `users-me.route.test.ts` | `GET /api/users/me`: 200, 401, 404, 500, sensitive data leak, FULL_PROFILE_SELECT object | 7 | ✅ |

### 2d. การทดสอบ Validation เพิ่มเติม

| ลำดับ | รายการทดสอบ (Test Suite) | คำอธิบายสิ่งที่ทดสอบ | ผลลัพธ์ |
| :--- | :--- | :--- | :---: |
| 11 | `validation.test.ts` | Zod Schema ของ Recipe, Ingredient, Review, Search | ✅ |
| 12 | `register.test.ts` | Zod registerSchema + duplicate detection + role mapping (เพิ่มเติม) | ✅ |

### 2e. Service Layer (Placeholder)

| ลำดับ | รายการทดสอบ (Test Suite) | คำอธิบายสิ่งที่ทดสอบ | ผลลัพธ์ |
| :--- | :--- | :--- | :---: |
| 13 | `services.test.ts` | Service layer — ยังไม่ได้ Implement (19 `test.todo`) | ⏳ |

*สถิติ Jest ล่าสุด: รันทั้งหมด 15 Test Suites (รวมทั้งหมด 104 Tests Passed + 19 Todo = 123 Tests) — ✅ ผ่านทุกเคส*

---

## 3. สรุปผลการทดสอบทั้งหมด

| ประเภท | จำนวน Suites | จำนวน Tests | ผลลัพธ์ |
| :--- | :---: | :---: | :---: |
| Playwright E2E (Auth) | 1 | 3 | ✅ Passed |
| Playwright E2E (Profile — w2-3) | 1 | 3 | ✅ Passed |
| Jest Unit & Integration | 15 | 104 Passed / 19 Todo | ✅ Passed |
| **รวมทั้งหมด** | **17** | **110 Passed / 19 Todo** | ✅ |

## 4. สิ่งที่เพิ่มในรอบนี้ (w2-3 Get Profile)

- `tests/auth-me.route.test.ts` — Route unit test สำหรับ `GET /api/auth/me` (7 tests)
- `tests/users-me.route.test.ts` — Route unit test สำหรับ `GET /api/users/me` (7 tests)
- `tests/e2e/profile.spec.ts` — Playwright E2E สำหรับ Profile flow (3 tests)
