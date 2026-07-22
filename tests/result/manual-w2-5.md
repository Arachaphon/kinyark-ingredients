=== Manual Test Plan — w2-5 Update Profile

[1] เปิด npm run dev
[2] เปิด http://localhost:3000
[3] ลงทะเบียน/ล็อกอิน user ก่อนทดสอบ
[4] ใช้ Browser DevTools (F12 → Network/Console) หรือ Postman/curl

=== Prerequisites

- มี user ที่ register + login ได้
- Browser DevTools (F12 → Network/Console)
- curl หรือ Postman (สำหรับ API tests)

=== API: PATCH /api/users/me

[/] TC01 - อัปเดต username สำเร็จ
    -> Steps:
       1. Login ที่ /login
       2. DevTools → Console
       3. เรียก: await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'newusername' }) })
       4. console.log(await res.json())
    -> Expected: status 200, response.data.user.username = 'newusername'

[/] TC02 - ตรวจสอบ username ใหม่ผ่าน GET /api/users/me
    -> Steps:
       1. หลังจากทำ TC01 แล้ว
       2. เรียก: await fetch('/api/users/me')

        const res = await fetch("/api/users/me", {
        method: "GET",
        credentials: "include",
        });

        
       3. console.log(await res.json())

       const data = await res.json();
       console.log("Status:", res.status);
        console.log("Response:", data);
        console.log("Username:", data.user?.username);

    -> Expected: status 200, response.user.username = 'newusername'


        
[/] TC03 - ปฏิเสธ username ที่สั้นกว่า 2 ตัวอักษร
    -> Steps:
       1. Login → DevTools
       2. เรียก: await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'a' }) })
    -> Expected: status 400, error มีข้อความ "ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 2 ตัวอักษร"
    -> Result:

[/] TC04 - ปฏิเสธ username ที่ยาวเกิน 30 ตัวอักษร
    -> Steps:
       1. Login → DevTools
       2. เรียก: await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'a'.repeat(31) }) })
    -> Expected: status 400, error มีข้อความ "ยาวเกินไป"
    -> Result:

[/] TC05 - อัปเดต avatar URL สำเร็จ
    -> Steps:
       1. Login → DevTools
       2. เรียก: await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatarUrl: 'https://example.com/avatar.jpg' }) })
    -> Expected: status 200, response.data.user.avatarUrl = 'https://example.com/avatar.jpg'
    -> Result:

[/] TC06 - ลบ avatar โดยส่ง avatarUrl: null
    -> Steps:
       1. Login → DevTools (user ควรมี avatarUrl อยู่ก่อน)
       2. เรียก: await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatarUrl: null }) })
    -> Expected: status 200, response.data.user.avatarUrl = null
    -> Result:

[/] TC07 - ปฏิเสธ avatar URL ที่ไม่ถูกต้อง
    -> Steps:
       1. Login → DevTools
       2. เรียก: await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatarUrl: 'not-a-url' }) })
    -> Expected: status 400, error มีข้อความ "รูปแบบ URL ไม่ถูกต้อง"
    -> Result:

[/] TC08 - ส่งคำขอเปลี่ยนอีเมลสำเร็จ
    -> Steps:
       1. Login → DevTools
       2. เรียก: await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'เมลจริง' }) })
    -> Expected: status 200, response.data.emailChangePending = true

    -> Result: 

[/] TC09 - ตรวจสอบว่าอีเมลที่ยังไม่ยืนยันมีสถานะ pending
    -> Steps:
       1. หลังจากทำ TC08 แล้ว
       2. เรียก: await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'pendingemail@gmail.com' }) })
    -> Expected: status 200, response.data.emailChangePending = true (ยังไม่ยืนยัน)
    -> Result:

[/] TC10 - ตรวจสอบว่า GET ยังคืนอีเมลที่ยืนยันแล้ว
    -> Steps:
       1. หลังจากทำ TC08 หรือ TC09
       2. เรียก: await fetch('/api/users/me')
    -> Expected: response.user.email ยังเป็นอีเมลเดิมที่ยืนยันแล้ว ไม่ใช่อีเมลใหม่ที่ยังไม่ยืนยัน
    -> Result:

[/] TC11 - ปฏิเสธรูปแบบอีเมลไม่ถูกต้อง
    -> Steps:
       1. Login → DevTools
       2. เรียก: await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'invalid-email' }) })
    -> Expected: status 400, error มีข้อความ "รูปแบบอีเมลไม่ถูกต้อง"
    -> Result:

[/] TC12 - เปลี่ยนรหัสผ่านด้วย current password ที่ถูกต้อง
    -> Steps:
       1. Login ด้วยรหัสผ่านเดิม (OldPass1!)
       2. DevTools → Console
       3. excample : เรียก: await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword: 'NewPass1!', currentPassword: 'OldPass1!' }) })
    -> Expected: status 200, response.data.passwordUpdated = true
    -> Result:

[/] TC13 - Logout แล้ว Login ด้วยรหัสผ่านใหม่
    -> Steps:
       1. หลังจากทำ TC12 แล้ว
       2. Logout (POST /api/auth/logout)
       3. Login ด้วยอีเมลเดิม + รหัสผ่านใหม่ (NewPass1!)
    -> Expected: Login สำเร็จ
    -> Result:

[/] TC14 - ตรวจสอบว่ารหัสผ่านเดิมใช้งานไม่ได้
    -> Steps:
       1. หลังจากทำ TC12 แล้ว (หรือหลังจาก TC13)
       2. Logout
       3. Login ด้วยอีเมลเดิม + รหัสผ่านเก่า (OldPass1!)
    -> Expected: Login ไม่สำเร็จ, แสดง error
    -> Result:

[/] TC15 - ปฏิเสธ current password ที่ไม่ถูกต้อง
    -> Steps:
       1. Login → DevTools
       2. เรียก: await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword: 'NewPass1!', currentPassword: 'wrongpassword' }) })
    -> Expected: status 400, error = "Incorrect current password"


[] TC16 - ปฏิเสธ newPassword ที่ไม่มี currentPassword
    -> Steps:
       1. Login → DevTools
       2. เรียก: await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword: 'NewPass1!' }) })
    -> Expected: status 400, error มีข้อความ "กรุณากรอกรหัสผ่านปัจจุบัน"
    -> Result:

[] TC17 - ปฏิเสธ request body ว่าง
    -> Steps:
       1. Login → DevTools
       2. เรียก: await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    -> Expected: status 400, error มีข้อความ "ไม่มีข้อมูลที่จะอัปเดต"
    -> Result:

[] TC18 - ปฏิเสธ request ที่มีเพียง currentPassword
    -> Steps:
       1. Login → DevTools
       2. เรียก: await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: 'somepass' }) })
    -> Expected: status 400, error มีข้อความ "ไม่มีข้อมูลที่จะอัปเดต"
    -> Result:

[] TC19 - ปฏิเสธ request ที่ไม่มี session ด้วย 401
    -> Steps:
       1. เปิด Tab ใหม่แบบไม่ login (หรือ clear cookies)
       2. DevTools → Console
       3. เรียก: await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'newname' }) })
    -> Expected: status 401, error = "Unauthorized"
    -> Result:

[] TC20 - ตรวจสอบว่า response ไม่มี currentPassword
    -> Steps:
       1. Login → DevTools
       2. เรียก: await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'test' }) })
       3. console.log(await res.json())
    -> Expected: response ไม่มีฟิลด์ currentPassword
    -> Result:

[] TC21 - ตรวจสอบว่า response ไม่มี newPassword
    -> Steps:
       1. Login → DevTools
       2. เรียก: await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword: 'NewPass1!', currentPassword: 'OldPass1!' }) })
       3. console.log(await res.json())
    -> Expected: response ไม่มีฟิลด์ newPassword
    -> Result:

[] TC22 - ตรวจสอบว่า response ไม่มี token หรือ session
    -> Steps:
       1. Login → DevTools
       2. เรียก: await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'test' }) })
       3. console.log(await res.json())
    -> Expected: response ไม่มี accessToken, refreshToken, session หรือ sensitive data
    -> Result:

[] TC23 - ตรวจสอบสถานะ bucket avatars
    -> Steps:
       1. เปิด Supabase Dashboard
       2. ไปที่ Storage → Buckets
       3. ตรวจสอบว่ามี bucket ชื่อ "avatars"
    -> Expected: avatars bucket exists (หรือบันทึกสถานะตามที่ตรวจสอบได้)
    -> Result:

[] TC24 - ตรวจสอบว่าไม่มีการแก้ไข frontend เพื่อทดสอบฟีเจอร์นี้
    -> Steps:
       1. git diff --name-only
       2. ตรวจสอบว่าไม่มีไฟล์ใน src/components/ หรือ src/app/**/page.tsx
    -> Expected: ไม่มีการแก้ไข frontend source files
    -> Result:

=== Note

- API PATCH /api/users/me ใช้ Zod validation ผ่าน updateProfileSchema
- Password change ต้องใช้ currentPassword เพื่อยืนยันตัวตน
- Email change ผ่าน Supabase Auth ต้องยืนยันทางอีเมลก่อน
- อีเมลที่ยังไม่ยืนยันจะไม่ถูกอัปเดตใน Prisma database
- การอัปเดต Prisma รับเฉพาะฟิลด์ username และ avatarUrl เท่านั้น
