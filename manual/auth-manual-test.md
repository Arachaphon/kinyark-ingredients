# Manual Test Cases: Authentication

## Feature: Login (W1-11)
- [x] 1. **Empty Fields**: Submit empty email/username or password. 
  *Expected: Validation error message.*
- [x] 2. **User Not Found**: Login with an unregistered username.
  *Expected: Returns "ไม่พบบัญชีผู้ใช้นี้"*
- [x] 3. **Invalid Credentials**: Login with correct email/username but wrong password.
  *Expected: Returns "อีเมล/ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"*
- [x] 4. **Successful Login**: Login with correct email/username and password.
  *Expected: Redirects to `/home`.*

## Feature: Register (W1-12)
- [x] 1. **Validation Failure**: Submit empty fields or short password.
  *Expected: Returns validation errors.*
- [x] 2. **Duplicate Email/Username**: Register with an existing email or username.
  *Expected: Returns error indicating user already exists.*
- [x] 3. **Successful Registration**: Submit valid and unique details.
  *Expected: Successfully creates user and redirects appropriately.*

## Feature: Change Password (W1-13)
- [ ] 1. **Unauthorized Access**: Attempt to call change password API without being logged in. 
  *Expected: Returns `401 Unauthorized` with error message "คุณยังไม่ได้เข้าสู่ระบบ"*
- [ ] 2. **Validation Failure**: Submit empty `oldPassword`, or `newPassword` that doesn't meet criteria, or mismatching `confirmPassword`.
  *Expected: Returns `400 Bad Request` with validation error details.*
- [ ] 3. **Incorrect Old Password**: Submit an incorrect `oldPassword` for the currently logged-in user.
  *Expected: Returns `400 Bad Request` with error message "รหัสผ่านเดิมไม่ถูกต้อง"*
- [ ] 4. **Successful Change**: Submit correct `oldPassword` and a valid `newPassword` that matches `confirmPassword`.
  *Expected: Returns `200 OK` and updates the user's password in Supabase successfully.*

## Feature: Delete Account (W1-15)
- [ ] 1. **Unauthorized Access**: Attempt to call delete account API without being logged in.
  *Expected: Returns `401 Unauthorized` with error message "คุณยังไม่ได้เข้าสู่ระบบ"*
- [ ] 2. **Validation Failure**: Submit request without password or empty password.
  *Expected: Returns `400 Bad Request` with validation error details.*
- [ ] 3. **Incorrect Password**: Submit an incorrect password to confirm deletion.
  *Expected: Returns `400 Bad Request` with error message "รหัสผ่านไม่ถูกต้อง"*
- [ ] 4. **Successful Deletion**: Submit correct password.
  *Expected: Returns `200 OK`, deletes user from Prisma and Supabase, and signs out.*
