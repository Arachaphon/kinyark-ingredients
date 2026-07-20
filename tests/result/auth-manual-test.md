=== Manual Test Plan — Registration & Login

[1] เปิด npm run dev
[2] ไป http://localhost:3000/register

=== Register Tests
[/] TC01 - ลงทะเบียนสำเร็จ (user ทั่วไป)
    -> กรอก: username, email, password (StrongP@ss1), confirm, role=คนทั่วไป
    -> Expected: redirect ไป /check-email

[/] TC02 - ลงทะเบียนสำเร็จ (ร้านค้า)
    -> กรอก: username, email, password, confirm, role=ร้านค้า
    -> Expected: redirect ไป /check-email
[/] TC03 - อีเมลซ้ำ
    -> กรอก email ที่ใช้ไปแล้ว
    -> Expected: error "อีเมลนี้ถูกใช้งานแล้ว"
Result:ลงทะเบียนไม่ได้ แต่ไม่ขึ้นคำว่า อีเมลนี้ถูกใช้งานแล้ว ขึ้นแต่กล่องแดงเปล่า

[/] TC04 - ชื่อผู้ใช้ซ้ำ
    -> กรอก username ที่มีอยู่แล้ว
    -> Expected: error "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว"
Result:ลงทะเบียนไม่ได้ แต่ไม่ขึ้นคำว่า ชื่อผู้ใช้นี้ถูกใช้งานแล้ว ขึ้นแต่กล่องแดงเปล่า

[/] TC05 - รหัสผ่านไม่ตรงเงื่อนไข
    -> ลอง: aaaaaaa (8 chars), WEAKPASS1!, weakpass1!, StrongPass1, StrongP@ss
    -> Expected: error ตามเงื่อนไขที่ขาด

[/] TC06 - รหัสผ่านกับ confirm ไม่ตรงกัน
    -> Expected: error "รหัสผ่านไม่ตรงกัน"

[/] TC07 - ไม่กรอก field ใด field นึง
    -> Expected: browser native validation

=== Login Test
[/] TC08 - Login ด้วยอีเมล
    -> Expected: login สำเร็จ ไป /home

[/] TC09 - Login ด้วยชื่อผู้ใช้
    -> Expected: login สำเร็จ ไป /home

[/] TC10 - Login ด้วยอีเมล/username ที่ไม่มี
    -> Expected: error "ไม่พบบัญชีผู้ใช้นี้"

[/] TC11 - รหัสผ่านผิด
    -> Expected: error "อีเมล/ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
    

[/] TC12 - Login fail: empty fields

[/] TC13 - Already-logged-in user visiting /login redirects to /home

[/] TC14 - Unauthenticated access to protected routes redirects to /login

=== Logout Test
[/] TC15 - Logout clears session

[/] TC16 - Logout redirects to /login