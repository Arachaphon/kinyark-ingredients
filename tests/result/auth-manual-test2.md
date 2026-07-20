=== Manual Test Plan — w2-3 Get Profile

[1] เปิด npm run dev
[2] เปิด http://localhost:3000
[3] ลงทะเบียน/ล็อกอิน user ก่อนทดสอบ

=== Prerequisites

- มี user ที่ register + login ได้
- Browser DevTools (F12 → Network/Console)
- (Optional) curl, Postman หรือ Thunder client สำหรับส่ง request โดยตรง

=== GET /api/auth/me

[] TC01 - ดึง Profile สำเร็จ (Authenticated)
    -> Steps:
       1. Login ที่ /login ด้วย user จริง
       2. เปิด DevTools → Console
       3. เรียก: await fetch('/api/auth/me').then(r => r.json())
    -> Expected: status 200, response มี { user: { id, username, email, avatarUrl } }
    -> Result:

[] TC02 - ไม่มี Session (Unauthenticated)
    -> Steps:
       1. เปิด Tab ใหม่ หรือ logout (clear cookies)
       2. DevTools → Console
       3. เรียก: await fetch('/api/auth/me').then(r => r.json())
    -> Expected: status 401, response = { error: "Unauthorized" }
    -> Result:

[] TC03 - JWT หมดอายุ / ไม่ถูกต้อง
    -> Steps:
       1. เปิด Console → ลบ Cookie ที่มีคำว่า sb- / supabase
       2. เรียก: await fetch('/api/auth/me').then(r => r.json())
    -> Expected: status 401, response = { error: "Unauthorized" }
    -> Result:

=== GET /api/users/me

[] TC04 - ดึง Full Profile สำเร็จ (Authenticated)
    -> Steps:
       1. Login
       2. Console: await fetch('/api/users/me').then(r => r.json())
    -> Expected: status 200, response มี { user: { id, username, email, avatarUrl, role, createdAt } }
    -> แตกต่างจาก /api/auth/me: ต้องมี role และ createdAt
    -> Result:

[] TC05 - ไม่มี Session (Unauthenticated)
    -> Steps: เหมือน TC02 แต่เรียก /api/users/me
    -> Expected: status 401, { error: "Unauthorized" }
    -> Result:

=== Navbar → SettingModal (UI Test)

[] TC06 - Profile แสดงใน SettingModal หลังล็อกอิน
    -> Steps:
       1. Login → ไป /home
       2. คลิก Avatar (วงกลมที่มีตัวอักษรหรือรูป มุมบนขวา)
       3. รอ SettingModal แสดง
       4. ดูหัวข้อ "ตั้งค่า" และ Tab "โปรไฟล์"
       5. ดู username และ email ใน Modal
    -> Expected: ชื่อ user และ email แสดงถูกต้องตรงกับที่สมัคร
    -> Result:

=== Response Schema Verification

[] TC07 - 200 Response ไม่มี sensitive fields รั่วไหล
    -> Steps:
       1. Login
       2. Console: const res = await (await fetch('/api/auth/me')).json()
       3. พิมพ์: Object.keys(res.user)
       4. ตรวจสอบว่าไม่มี key: password, hash, token, secret
    -> Expected: keys มีแค่ id, username, email, avatarUrl (หรือ role, createdAt สำหรับ users/me)
    -> Result:

[] TC08 - 401 Response Shape
    -> Steps: ส่ง request โดยไม่มี cookie → เช็ค response
    -> Expected: { error: "Unauthorized" } — ไม่มี field พิเศษอื่น
    -> Result:

[] TC09 - 404 Response Shape (กรณี user มีใน Auth แต่ไม่มีใน DB)
    -> Steps: (ต้องลบ Prisma record โดยตรง) หรือใช้ mock
    -> Expected: { error: "Not found" }
    -> หมายเหตุ: กรณีนี้เกิดยากใน production ถ้า register ถูกต้อง
    -> Result:

=== API Response Schema Reference

==== GET /api/auth/me

| Status | Response Body |
|--------|---------------|
| 200 | `{ "user": { "id": "uuid", "username": "string\|null", "email": "string", "avatarUrl": "string\|null" } }` |
| 401 | `{ "error": "Unauthorized" }` |
| 404 | `{ "error": "Not found" }` |
| 500 | `{ "error": "Internal Server Error" }` |

==== GET /api/users/me

| Status | Response Body |
|--------|---------------|
| 200 | `{ "user": { "id": "uuid", "username": "string\|null", "email": "string", "avatarUrl": "string\|null", "role": "string", "createdAt": "ISO8601" } }` |
| 401 | `{ "error": "Unauthorized" }` |
| 404 | `{ "error": "Not found" }` |
| 500 | `{ "error": "Internal Server Error" }` |
