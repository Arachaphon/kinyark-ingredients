=== Manual Test Plan — w2-8 Change Password (backend validation)

[1] เปิด npm run dev
[2] เปิด http://localhost:3000
[3] ล็อกอิน user ก่อนทดสอบ
[4] ใช้ Browser DevTools (F12 → Network/Console)

=== Prerequisites

- มี user ที่ register + login ได้
- รู้ current password (สมมติ: OldPass1!)
- Browser DevTools (F12 → Network/Console)

=== Testing through SettingModal Profile tab

[/] TC01 - เปลี่ยนรหัสผ่านสำเร็จ (full flow)
    -> Steps:
       1. Login ด้วยรหัสผ่านเดิม
       2. คลิก avatar → Setting → Profile tab
       3. กรอก current password, new password ใหม่, ยืนยัน new password
       4. กด ยืนยัน
       5. ตรวจสอบ Network tab: status 200
       6. Logout
       7. Login ด้วยรหัสผ่านใหม่
    -> Expected: เปลี่ยนรหัสผ่านสำเร็จ, Login ด้วยรหัสผ่านใหม่ได้
    -> Result:

[/] TC02 - ปฏิเสธ current password ไม่ถูกต้อง
    -> Steps:
       1. Login → SettingModal → Profile tab
       2. กรอก current password: wrongpass
       3. กรอก new password: NewPass1! (ตรงกันทั้งสองช่อง)
       4. กด ยืนยัน
       5. ตรวจสอบ Network tab: status 400
    -> Expected: แสดง error ใต้ currentPassword field, form ไม่ปิด
    -> Result:

[/] TC03 - ปฏิเสธ new password ที่อ่อน (client-side)
    -> Steps:
       1. Login → SettingModal → Profile tab
       2. กรอก current password ใด ๆ
       3. กรอก new password: short (น้อยกว่า 8 ตัว)
       4. ตรวจสอบว่าปุ่ม ยืนยัน disabled
    -> Expected: ปุ่ม ยืนยัน disabled, แสดงข้อความ error ความยาว
    -> Result:

[/] TC04 - ปฏิเสธการใส่รหัสผ่านใหม่ซ้ำกับรหัสผ่านปัจจุบัน
    -> Steps:
       1. Login → SettingModal → Profile tab
       2. กรอก current password: OldPass1!
       3. กรอก new password: OldPass1! (ค่าเดียวกัน)
       4. กด ยืนยัน
       5. ตรวจสอบ Network tab: status 400
    -> Expected: แสดง error ใน modal (จาก server), form ไม่ปิด
    -> Result:

[/] TC05 - ปุ่ม ยืนยัน disabled เมื่อ current password ว่าง
    -> Steps:
       1. Login → SettingModal → Profile tab
       2. กรอก current password: (เว้นว่าง)
       3. กรอก new password: NewPass1!
    -> Expected: ปุ่ม ยืนยัน disabled
    -> Result:

[/] TC06 - เปลี่ยนรหัสผ่าน → logout → login ด้วยรหัสผ่านเก่า → ควร fail
    -> Steps:
       1. หลังจาก TC01 (เปลี่ยนรหัสผ่านสำเร็จ)
       2. Logout
       3. Login ด้วยอีเมลเดิม + รหัสผ่านเก่า (OldPass1!)
    -> Expected: Login ไม่สำเร็จ, แสดง error
    -> Result:

[/] TC07 - Network tab ตรวจสอบ HTTP method และ status
    -> Steps:
       1. Login → DevTools → Network tab
       2. ทำ TC01–TC04 ซ้ำ
       3. ตรวจสอบ request method = PATCH
    -> Expected: ทุก request ที่ส่งไป /api/users/me เป็น PATCH
    -> Result:

=== Backend-only tests (via automated Jest tests)

- confirmPassword omitted — backward compatible → 200
- confirmPassword matches newPassword → 200
- confirmPassword does not match newPassword → 400
- newPassword equals currentPassword → 400
- Supabase updateUser fails for password → 400
- Unexpected error → 500
