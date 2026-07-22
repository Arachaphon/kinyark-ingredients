=== Manual Test Plan — w2-1 Logout User

[1] เปิด npm run dev
[2] เปิด http://localhost:3000
[3] ลงทะเบียน/ล็อกอิน user ก่อนทดสอบ

=== Prerequisites

- มี user ที่ register + login ได้
- Browser DevTools (F12 → Network/Console)

=== UI: Logout via SettingModal

[/] TC01 - Logout สำเร็จผ่าน UI
    -> Steps:
       1. Login ที่ /login ด้วย user จริง
       2. กดปุ่ม Avatar (มุมบนขวา) เพื่อเปิด SettingModal
       3. ใน Sidebar ซ้าย กดปุ่ม "ออกจากระบบ"
    -> Expected: Redirect ไป /login ทันที
    -> Result:

[/] TC02 - หลังจาก Logout แล้วเข้า /home ไม่ได้
    -> Steps:
       1. ทำ TC01 แล้ว
       2. เปิด http://localhost:3000/home
    -> Expected: ถูก redirect กลับไป /login (Middleware ป้องกัน)
    -> Result:

=== API: POST /api/auth/logout

[/] TC03 - Logout ผ่าน API โดยตรง (Authenticated)
    -> Steps:
       1. Login ที่ /login
       2. DevTools → Console
       3. เรียก: await fetch('/api/auth/logout', { method: 'POST', redirect: 'manual' })
    -> Expected: status 307, redirect ไป /login
    -> Result:

[/] TC04 - ตรวจสอบ Cookie หลัง Logout
    -> Steps:
       1. Login → DevTools → Application → Cookies
       2. จดค่า Cookies ทั้งหมด
       3. เรียก: await fetch('/api/auth/logout', { method: 'POST', redirect: 'manual' })
       4. ดู Cookies อีกครั้ง
    -> Expected: Cookies ที่เกี่ยวกับ session (sb-, supabase) ถูกลบหรือเปลี่ยนเป็นค่า empty
    -> Result:

[/] TC05 - Logout โดยไม่มี Session (Guest)
    -> Steps:
       1. เปิด Tab ใหม่แบบไม่ login (หรือ clear cookies)
       2. DevTools → Console
       3. เรียก: await fetch('/api/auth/logout', { method: 'POST', redirect: 'manual' })
    -> Expected: status 307, redirect ไป /login (ไม่ควร error)
    -> Result:

=== Cross-tab Behavior

[/] TC06 - Logout ใน Tab หนึ่ง → Tab อื่นรู้สถานะ
    -> Steps:
       1. Login ใน Tab A
       2. เปิด Tab B → ไป /home → ควรโหลดได้
       3. Tab A → logout (ผ่าน UI หรือ API)
       4. กลับมา Tab B → ลอง navigate หรือ refresh
    -> Expected: Tab B ควรเปลี่ยนเป็น unauthenticated (redirect ไป /login หรือแสดง login page)
    -> Result:

=== Note

- Logout API ใช้ Supabase SSR `signOut()` ซึ่งจะ clear server-side session cookies
- Client-side `AuthContext.signOut()` เรียก `supabase.auth.signOut()` เพื่อเคลียร์ state ฝั่ง client
- เมื่อ session cookie ถูกลบ, Middleware (`src/middleware.ts`) จะ redirect /home → /login
