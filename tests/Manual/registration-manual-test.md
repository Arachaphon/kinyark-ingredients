=== Manual Test Plan — Registration & Login

[1] เปิด npm run dev
[2] ไป http://localhost:3000/register

=== Register Tests
[X] TC01 - ลงทะเบียนสำเร็จ (user ทั่วไป)
    -> กรอก: username, email, password (StrongP@ss1), confirm, role=คนทั่วไป
    -> Expected: redirect ไป /check-email

[X] TC02 - ลงทะเบียนสำเร็จ (ร้านค้า)
    -> กรอก: username, email, password, confirm, role=ร้านค้า
    -> Expected: redirect ไป /check-email

[x] TC03 - อีเมลซ้ำ
    -> กรอก email ที่ใช้ไปแล้ว
    -> Expected: error "อีเมลนี้ถูกใช้งานแล้ว"
Result:ลงทะเบียนไม่ได้ แต่ไม่ขึ้นคำว่า อีเมลนี้ถูกใช้งานแล้ว ขึ้นแต่กล่องแดงเปล่า

[x] TC04 - ชื่อผู้ใช้ซ้ำ
    -> กรอก username ที่มีอยู่แล้ว
    -> Expected: error "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว"
Result:ลงทะเบียนไม่ได้ แต่ไม่ขึ้นคำว่า ชื่อผู้ใช้นี้ถูกใช้งานแล้ว ขึ้นแต่กล่องแดงเปล่า

[X] TC05 - รหัสผ่านไม่ตรงเงื่อนไข
    -> ลอง: aaaaaaa (7 chars), WEAKPASS1!, weakpass1!, StrongPass1, StrongP@ss
    -> Expected: error ตามเงื่อนไขที่ขาด

[X] TC06 - รหัสผ่านกับ confirm ไม่ตรงกัน
    -> Expected: error "รหัสผ่านไม่ตรงกัน"

[x] TC07 - ไม่กรอก field ใด field นึง
    -> Expected: browser native validation

=== Login Test
[x] TC08 - Login ด้วยอีเมล
    -> Expected: login สำเร็จ ไป /home

[x] TC09 - Login ด้วยชื่อผู้ใช้
    -> Expected: login สำเร็จ ไป /home

[x] TC10 - Login ด้วยอีเมล/username ที่ไม่มี
    -> Expected: error "ไม่พบบัญชีผู้ใช้นี้"

[x] TC11 - รหัสผ่านผิด
    -> Expected: error "อีเมล/ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"