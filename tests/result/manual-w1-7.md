/* ============================================================
   Manual Console Test Cases - W1-7 Delete Recipe (DELETE)
   ============================================================
   วิธีทดสอบ:
   1. เปิดบราวเซอร์ไปที่หน้าเว็บหลัก (เช่น http://localhost:3000)
   2. ล็อกอินเข้าสู่ระบบ
   3. เปิด Developer Tools (กด F12) แล้วไปที่แท็บ Console
   4. คัดลอกโค้ดด้านล่างนี้ไปวางเพื่อรันและตรวจสอบผลลัพธ์
   ============================================================ */

/* ================= POSITIVE CASES ================= */

// ----------------------------------------------------
// 1. ลบสูตรอาหารของตนเอง (Recipe Owner)
// หมายเหตุ: ต้องนำ ID ของสูตรอาหารของตัวเองที่อยู่ใน Database มาใส่แทน 'YOUR_RECIPE_ID'
// คาดหวัง: Status: 200, Body: { data: { success: true, id: "..." } }
// ----------------------------------------------------
const myRecipeId = 'YOUR_RECIPE_ID';

await fetch(`/api/recipes/${myRecipeId}`, {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
}).then(async (res) => console.log('1. Delete Own Recipe - Status:', res.status, 'Body:', await res.json()));


/* ================= NEGATIVE CASES ================= */

// ----------------------------------------------------
// 2. พยายามลบสูตรอาหารที่ไม่มีอยู่จริง (Not Found)
// คาดหวัง: Status: 404, Body: { error: "Recipe not found" }
// ----------------------------------------------------
const nonExistentId = '00000000-0000-0000-0000-000000000000';

await fetch(`/api/recipes/${nonExistentId}`, {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
}).then(async (res) => console.log('2. Delete Non-Existent Recipe - Status:', res.status, 'Body:', await res.json()));


// ----------------------------------------------------
// 3. พยายามลบสูตรอาหารด้วย ID ที่มีรูปแบบไม่ถูกต้อง (Invalid UUID format)
// คาดหวัง: Status: 400, Body: { error: "Invalid recipe ID" } (หรือที่เกี่ยวข้องกับ Validation)
// ----------------------------------------------------
const invalidId = 'not-a-valid-uuid-format';

await fetch(`/api/recipes/${invalidId}`, {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
}).then(async (res) => console.log('3. Delete Invalid ID format - Status:', res.status, 'Body:', await res.json()));


// ----------------------------------------------------
// 4. พยายามลบสูตรอาหารของผู้อื่น (Forbidden)
// หมายเหตุ: ต้องนำ ID ของสูตรอาหารที่เป็นของผู้อื่นมาใส่แทน 'OTHER_USER_RECIPE_ID'
// คาดหวัง: Status: 403, Body: { error: "Forbidden" }
// ----------------------------------------------------
const otherRecipeId = 'OTHER_USER_RECIPE_ID';

await fetch(`/api/recipes/${otherRecipeId}`, {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
}).then(async (res) => console.log('4. Delete Other\'s Recipe - Status:', res.status, 'Body:', await res.json()));
