# E2E Test Execution Report

**Project:** KINYARK INGREDIENTS
**Date:** 2026-08-31
**Framework:** Playwright (Chromium)
**Total Execution Time:** 1.1m (66s)

---

## 📈 Overall Summary

| Total Tests | Passed | Failed | Skipped | Success Rate |
| :---: | :---: | :---: | :---: | :---: |
| **28** | **28** | **0** | **0** | **100%** |

---

## 📊 Detailed Test Matrix

| File Name | Test Case | Category | Description | Result | Time |
| :--- | :--- | :--- | :--- | :---: | :---: |
| auth.spec.ts | Successful signup, login, and access protected route | E2E Flow | สมัครสมาชิก ล็อกอิน และเข้าหน้าสำหรับสมาชิกสำเร็จ | PASS | ~15s |
| auth.spec.ts | Signup with duplicate email shows error | Validation | สมัครสมาชิกด้วยอีเมลซ้ำ ระบบต้องแจ้งเตือน error | PASS | ~4s |
| auth.spec.ts | Login with wrong password shows error | Security | ล็อกอินด้วยรหัสผ่านผิด ระบบต้องไม่อนุญาต | PASS | ~4s |
| profile.spec.ts | Shows user profile in SettingModal after login | UI Component | เช็กการแสดงผลข้อมูลโปรไฟล์ใน Setting Modal | PASS | ~15s |
| profile.spec.ts | Returns 401 when accessing profile API without session | API Security | ยิง API ดึงโปรไฟล์แบบไม่มี session ต้องได้ 401 | PASS | ~0.2s |
| profile.spec.ts | Returns user data when calling profile API with session | API Endpoint | ยิง API ดึงโปรไฟล์แบบมี session ต้องได้ข้อมูล | PASS | ~4s |
| profile.spec.ts | PATCH /api/users/me - updates username | API Mutation | ทดสอบอัปเดตชื่อผู้ใช้ผ่าน API | PASS | ~4s |
| profile.spec.ts | PATCH /api/users/me - requests email update | API Mutation | ทดสอบส่งคำขอเปลี่ยนอีเมลผ่าน API | PASS | ~4s |
| profile.spec.ts | PATCH /api/users/me - updates password | Auth Security | เปลี่ยนรหัสผ่านและทดสอบใช้รหัสใหม่ล็อกอิน | PASS | ~6s |
| profile.spec.ts | PATCH /api/users/me - returns 401 without session | API Security | อัปเดตโปรไฟล์แบบไม่มี session ต้องได้ 401 | PASS | ~0.1s |
| upload-avatar.spec.ts | Uploads valid JPEG avatar via API & confirms persistence | Supabase Storage | อัปโหลดรูป JPEG และเช็กว่าบันทึก URL สำเร็จ | PASS | ~5s |
| upload-avatar.spec.ts | Returns 401 for unauthenticated upload | Security Guard | อัปโหลดรูปโดยไม่ล็อกอิน ต้องได้ 401 | PASS | ~0.1s |
| upload-avatar.spec.ts | Returns 400 for missing file | Input Validation | ยิงอัปโหลดโดยไม่แนบไฟล์รูป ต้องได้ 400 | PASS | ~4s |
| upload-avatar.spec.ts | Replaces existing avatar with new image | Storage Lifecycle | อัปโหลดรูปใหม่ทับรูปเดิม และตรวจสอบ URL เปลี่ยน | PASS | ~6s |
| recipes.spec.ts | GET /api/recipes - fetches public recipe list | Recipe Feed | ดึงรายการสูตรอาหารสาธารณะจาก API | PASS | ~1s |
| recipes.spec.ts | POST /api/recipes - returns 401 when unauthorized | API Security | สร้างสูตรอาหารโดยไม่ล็อกอิน ต้องได้ 401 | PASS | ~0.1s |
| recipes.spec.ts | POST /api/recipes - creates new recipe and verifies in list | Recipe Lifecycle | สร้างสูตรอาหารใหม่ เรียกดูรายละเอียด และลบออก | PASS | ~6s |
| ai-recipe.spec.ts | POST /api/ai/generate-recipe - returns 400 when empty | Validation | ค้นหาสูตรอาหารจาก AI โดยไม่แนบวัตถุดิบ ต้องได้ 400 | PASS | ~0.1s |
| ai-recipe.spec.ts | POST /api/ai/generate-recipe - generates recipes | AI Service | ทดสอบยิงค้นหาสูตรอาหารด้วยวัตถุดิบผ่าน AI | PASS | ~2s |
| favorites.spec.ts | GET /api/favorites - returns 401 when unauthorized | API Security | ดึงรายการเมนูโปรดโดยไม่ล็อกอิน ต้องได้ 401 | PASS | ~0.1s |
| favorites.spec.ts | POST /api/favorites - toggles recipe favorite status | User Engagement | กดเพิ่มเมนูโปรด เช็กในรายการ และกดเลิกชอบ | PASS | ~5s |
| reviews.spec.ts | POST /api/reviews - returns 401 when unauthorized | API Security | เขียนรีวิวโดยไม่ล็อกอิน ต้องได้ 401 | PASS | ~0.1s |
| reviews.spec.ts | POST /api/reviews - creates review and prevents duplicate | Rating & Review | เขียนรีวิว ให้คะแนน และเช็กระบบกันรีวิวซ้ำ | PASS | ~5s |
| search.spec.ts | GET /api/search - returns search results by query keyword | Search Engine | ค้นหาสูตรอาหารด้วย Keyword | PASS | ~0.5s |
| search.spec.ts | GET /api/search - returns search results by ingredients filter | Ingredient Filter | ค้นหากรองตามรายชื่อวัตถุดิบ | PASS | ~0.5s |
| search-history.spec.ts | GET /api/search-history - returns 401 when unauthorized | API Security | ดึงประวัติการค้นหาโดยไม่ล็อกอิน ต้องได้ 401 | PASS | ~0.1s |
| search-history.spec.ts | POST, GET, and DELETE /api/search-history - manages history | Search Lifecycle | บันทึกประวัติการค้นหา เรียกดู และสั่งล้างประวัติ | PASS | ~5s |
| ingredients.spec.ts | GET /api/ingredients - fetches ingredient list | Master Data | ดึงรายการวัตถุดิบและหมวดหมู่ทั้งหมด | PASS | ~0.5s |

---

## 🛠 Features Verified

1. Authentication Flow (auth.spec.ts)
2. Profile & Account Management (profile.spec.ts, upload-avatar.spec.ts)
3. Recipe Management (recipes.spec.ts)
4. AI Recipe Engine (ai-recipe.spec.ts)
5. Favorites System (favorites.spec.ts)
6. Reviews & Ratings System (reviews.spec.ts)
7. Search & Ingredient Filtering (search.spec.ts, ingredients.spec.ts)
8. Search History Management (search-history.spec.ts)