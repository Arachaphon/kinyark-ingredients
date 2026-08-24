/* ============================================================
   Manual Console Test Cases - Iteration 2 W1-4 Add & Remove Favorite
   ============================================================
   Copy and run these scripts in the browser console (DevTools)
   to test the favorites API layer in isolation.
   ============================================================ */

/* ================= 1. GET FAVORITES ================= */

// 1.1 ดึงรายการเมนูโปรดทั้งหมด (ต้องล็อกอินก่อน)
// คาดหวัง: Status: 200 OK, คืนค่าอาเรย์ { data: [...] } ที่ประกอบด้วยสูตรอาหารที่เคยบันทึกไว้
// ----------------------------------------------------
await fetch("/api/favorites")
  .then(async (res) => console.log("Get Favorites - Status:", res.status, "Body:", await res.json()));


/* ================= 2. TOGGLE FAVORITE (POST) ================= */

// 2.1 สลับสถานะ Favorite โดยไม่เข้าสู่ระบบ (ต้องเปิด Incognito หรือลบคุกกี้ก่อนรัน)
// คาดหวัง: Status: 401 Unauthorized, คืนค่า { error: "Unauthorized" }
// ----------------------------------------------------
await fetch("/api/favorites", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ recipeId: "550e8400-e29b-41d4-a716-446655440000" }),
  credentials: "omit"
}).then(async (res) => console.log("Post Favorite (No Auth) - Status:", res.status, "Body:", await res.json().catch(() => null)));


// 2.2 ส่งค่า Request Body ว่างเปล่า หรือไม่มี recipeId
// คาดหวัง: Status: 400 Bad Request, คืนค่า { error: "...expected string..." }
// ----------------------------------------------------
await fetch("/api/favorites", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({})
}).then(async (res) => console.log("Post Favorite (Empty Body) - Status:", res.status, "Body:", await res.json()));


// 2.3 ส่งค่า recipeId ที่ไม่ใช่รูปแบบ UUID
// คาดหวัง: Status: 400 Bad Request, คืนค่า { error: "Invalid recipe ID" }
// ----------------------------------------------------
await fetch("/api/favorites", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ recipeId: "not-a-uuid-format" })
}).then(async (res) => console.log("Post Favorite (Invalid UUID) - Status:", res.status, "Body:", await res.json()));


// 2.4 ส่งค่า recipeId ที่เป็น UUID แต่ไม่มีเมนูนี้อยู่ในระบบจริงๆ
// คาดหวัง: Status: 404 Not Found, คืนค่า { error: "Recipe not found" }
// ----------------------------------------------------
await fetch("/api/favorites", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ recipeId: "a2f3c7c4-07e3-41c8-bfbe-494d014982b2" }) // มั่นใจว่า id นี้ไม่มีใน DB จริง
}).then(async (res) => console.log("Post Favorite (Recipe Not Found) - Status:", res.status, "Body:", await res.json()));


// 2.5 เพิ่มเมนูเป็นรายการโปรด (Positive Case: Add Favorite)
// หมายเหตุ: กรุณาสร้างสูตรอาหารใหม่ หรือดึง UUID ของสูตรอาหารที่มีในระบบจริงมาใส่ด้านล่าง
// คาดหวัง: Status: 201 Created, คืนค่า { data: { favorited: true } } และค่า favoriteCount ของเมนูนั้นใน DB จะบวกเพิ่ม 1
// ----------------------------------------------------
const targetRecipeId = "ใส่_REAL_RECIPE_UUID_ตรงนี้"; // แทนค่าด้วยไอดีเมนูที่มีในระบบจริงๆ

await fetch("/api/favorites", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ recipeId: targetRecipeId })
}).then(async (res) => console.log("Add Favorite Result - Status:", res.status, "Body:", await res.json()));


// 2.6 ยกเลิกเมนูโปรดเดิม (Positive Case: Remove Favorite)
// ใช้ targetRecipeId เดียวกับขั้นตอน 2.5 ในการรันซ้ำอีกครั้ง
// คาดหวัง: Status: 200 OK, คืนค่า { data: { favorited: false } } และค่า favoriteCount ของเมนูนั้นใน DB จะลดลง 1
// ----------------------------------------------------
await fetch("/api/favorites", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ recipeId: targetRecipeId })
}).then(async (res) => console.log("Remove Favorite Result - Status:", res.status, "Body:", await res.json()));

