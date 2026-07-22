=== คู่มือทดสอบ Manual — w3-2 Upload Profile Image

[1] เปิด npm run dev
[2] เปิด http://localhost:3000
[3] ลงทะเบียน/ล็อกอิน user ก่อนทดสอบ
[4] ใช้ Browser DevTools (F12 → Network/Console) สำหรับทดสอบ API โดยตรง
    - คำสั่งใน Console จะใช้ session cookies ของ browser อัตโนมัติ

=== ข้อกำหนดเบื้องต้น

- มี user ที่ register + login ได้
- Browser DevTools (F12 → Network/Console)
- รูปภาพสำหรับทดสอบ: JPEG, PNG, ไฟล์ที่ไม่ใช่รูปภาพ, ไฟล์ขนาดใหญ่

=== API: POST /api/users/me/avatar

[/] TC01 - อัปโหลดรูป JPEG ที่ถูกต้องผ่านหน้าเว็บ
    -> Steps:
       1. Login ที่ /home
       2. คลิกที่ Avatar (มุมบนขวา) เพื่อเปิด SettingModal
       3. คลิกปุ่ม "เปลี่ยนรูปโปรไฟล์"
       4. เลือกไฟล์ JPEG ที่ถูกต้อง
       5. คลิกปุ่ม "ยืนยัน"
       6. สังเกตรูปโปรไฟล์ที่แสดง
    -> Expected: รูปโปรไฟล์เปลี่ยนเป็นรูปที่เลือก, ไม่มี error
    -> Actual Result:
    -> Status: Pass / Fail
    -> Evidence:

[/] TC02 - อัปโหลดรูป PNG ที่ถูกต้อง
    -> Steps:
       1. ทำตาม Steps ของ TC01 แต่เลือกไฟล์ PNG
    -> Expected: รูปโปรไฟล์เปลี่ยนเป็นรูป PNG ที่เลือก
    -> Actual Result:
    -> Status: Pass / Fail
    -> Evidence:

[/] TC03 - อัปโหลดรูป WebP ที่ถูกต้อง
    -> Steps:
       1. ทำตาม Steps ของ TC01 แต่เลือกไฟล์ WebP
    -> Expected: รูปโปรไฟล์เปลี่ยนเป็นรูป WebP ที่เลือก
    -> Actual Result:
    -> Status: Pass / Fail
    -> Evidence:

[/] TC04 - เปลี่ยนรูปโปรไฟล์ (Replace)
    -> Steps:
       1. ทำ TC01 ให้เรียบร้อย (มีรูปโปรไฟล์อยู่แล้ว)
       2. คลิกปุ่ม "เปลี่ยนรูปโปรไฟล์" อีกครั้ง
       3. เลือกไฟล์ JPEG รูปอื่น
       4. คลิก "ยืนยัน"
       5. รีเฟรชหน้า (F5)
    -> Expected: รูปโปรไฟล์เปลี่ยนเป็นรูปใหม่, รูปเก่าหายไป
    -> Actual Result:
    -> Status: Pass / Fail
    -> Evidence:

[/] TC05 - รีเฟรชหน้าแล้วรูปยังคงอยู่
    -> Steps:
       1. หลังจากทำ TC01 หรือ TC04 สำเร็จ
       2. กด F5 เพื่อรีเฟรชหน้า
    -> Expected: รูปโปรไฟล์ยังคงเป็นรูปที่อัปโหลดล่าสุด
    -> Actual Result:
    -> Status: Pass / Fail
    -> Evidence:

[/] TC06 - Logout แล้ว Login กลับมา รูปยังคงอยู่
    -> Steps:
       1. หลังจากมีรูปโปรไฟล์แล้ว
       2. Logout (คลิกปุ่มออกจากระบบ)
       3. Login ด้วย email และ password เดิม
    -> Expected: รูปโปรไฟล์ยังคงเป็นรูปเดิมที่อัปโหลดไว้
    -> Actual Result:
    -> Status: Pass / Fail
    -> Evidence:

[/] TC07 - รูปเริ่มต้น (default avatar) เมื่อไม่มีรูป
    -> Steps:
       1. ใช้ user ที่ยังไม่เคยอัปโหลดรูป
       2. Login เข้าสู่ระบบ
    -> Expected: แสดงตัวอักษรตัวแรกของ username (เช่น "U") แทนรูป
    -> Actual Result:
    -> Status: Pass / Fail
    -> Evidence:

[/] TC08 - เลือกไฟล์ที่ไม่ใช่รูปภาพ (เช่น .txt, .pdf)
    -> Steps:
       1. Login
       2. เปิด DevTools → Console
       3. รันคำสั่ง:
          const file = new File(['not an image'], 'test.txt', { type: 'text/plain' })
          const form = new FormData()
          form.append('avatar', file)
          const res = await fetch('/api/users/me/avatar', { method: 'POST', body: form })
          console.log(res.status, await res.json())
    -> Expected: status 400, error มีข้อความ "Invalid file type"
    -> Actual Result:
    -> Status: Pass / Fail
    -> Evidence:

[/] TC09 - อัปโหลดไฟล์ SVG
    -> Steps:
       1. Login → DevTools → Console
       2. รันคำสั่ง:
          const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
          const file = new File([svg], 'test.svg', { type: 'image/svg+xml' })
          const form = new FormData()
          form.append('avatar', file)
          const res = await fetch('/api/users/me/avatar', { method: 'POST', body: form })
          console.log(res.status, await res.json())
    -> Expected: status 400, error มีข้อความ "Invalid file type"
    -> Actual Result:
    -> Status: Pass / Fail
    -> Evidence:

[/] TC10 - อัปโหลดไฟล์ที่มีขนาดใหญ่เกิน 5 MB
    -> Steps:
       1. Login → DevTools → Console
       2. รันคำสั่ง:
          const big = new Uint8Array(6 * 1024 * 1024).fill(0xFF)
          big[0] = 0xFF; big[1] = 0xD8; big[2] = 0xFF
          const file = new File([big], 'big.jpg', { type: 'image/jpeg' })
          const form = new FormData()
          form.append('avatar', file)
          const res = await fetch('/api/users/me/avatar', { method: 'POST', body: form })
          console.log(res.status, await res.json())
    -> Expected: status 413, error มีข้อความ "too large"
    -> Actual Result:
    -> Status: Pass / Fail
    -> Evidence:

[/] TC11 - อัปโหลดโดยไม่ส่งไฟล์
    -> Steps:
       1. Login → DevTools → Console
       2. รันคำสั่ง:
          const form = new FormData()
          const res = await fetch('/api/users/me/avatar', { method: 'POST', body: form })
          console.log(res.status, await res.json())
    -> Expected: status 400, error มีข้อความ "No file provided"
    -> Actual Result:
    -> Status: Pass / Fail
    -> Evidence:

[/] TC12 - อัปโหลดโดยไม่มีการ Authentication
    -> Steps:
       1. เปิด tab ใหม่ (Incognito/Private)
       2. เปิด DevTools → Console
       3. รันคำสั่ง:
          const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
          const form = new FormData()
          form.append('avatar', file)
          const res = await fetch('/api/users/me/avatar', { method: 'POST', body: form })
          console.log(res.status, await res.json())
    -> Expected: status 401, error มีข้อความ "Unauthorized"
    -> Actual Result:
    -> Status: Pass / Fail
    -> Evidence:

[/] TC13 - ตรวจสอบว่า user อื่นไม่สามารถเข้าถึงหรือลบรูปของเราได้
    -> Steps:
       1. Login ด้วย user A → อัปโหลดรูป → คัดลอก avatarUrl จาก API response
       2. Logout → Login ด้วย user B
       3. DevTools → Console:
          const res = await fetch('/api/users/me')
          const data = await res.json()
          console.log('User B avatar:', data.user.avatarUrl)
    -> Expected: User B ไม่เห็น avatarUrl ของ User A
    -> Actual Result:
    -> Status: Pass / Fail
    -> Evidence:

[/] TC14 - อัปโหลดซ้ำหลายครั้งติดต่อกัน
    -> Steps:
       1. Login
       2. อัปโหลดรูปครั้งที่ 1 → บันทึก avatarUrl
       3. อัปโหลดรูปครั้งที่ 2 → บันทึก avatarUrl
       4. อัปโหลดรูปครั้งที่ 3 → บันทึก avatarUrl
       5. GET /api/users/me → ตรวจสอบ avatarUrl ล่าสุด
    -> Expected: avatarUrl ล่าสุดตรงกับครั้งที่ 3, ไม่มี error
    -> Actual Result:
    -> Status: Pass / Fail
    -> Evidence:

=== หมายเหตุ

- TC01-TC07 ทดสอบผ่าน UI จริง (หน้าเว็บ)
- TC08-TC14 ทดสอบผ่าน Browser DevTools Console เพื่อจำลอง edge cases
- การทดสอบผ่าน DevTools ใช้ session cookies ของ browser ที่ login อยู่แล้วโดยอัตโนมัติ
- หากพบข้อผิดพลาด ให้บันทึก response และ screenshot ไว้เป็นหลักฐาน
