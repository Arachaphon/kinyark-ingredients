/* ============================================================
   Manual Console Test Cases - Iteration 2 W1-6 Get Favorite Recipes
   ============================================================ */

const targetRecipeId = "ใส่_REAL_RECIPE_UUID_ตรงนี้"; // แทนค่าด้วยไอดีสูตรอาหารที่มีอยู่ในระบบจริง


/* ================= 1. GET FAVORITE STATUS ================= */

// 1.1 ตรวจสอบว่าผู้ใช้ปัจจุบันกด Favorite สูตรนี้ไว้หรือไม่ (ต้องล็อกอินก่อนรัน)
// คาดหวัง: Status: 200 OK, คืนค่า { data: { isFavorite: true หรือ false } }
// ----------------------------------------------------
await fetch(`/api/favorites?recipeId=${targetRecipeId}&action=status`)
  .then(async (res) => console.log("Get Favorite Status - Status:", res.status, "Body:", await res.json()));


// 1.2 ตรวจสอบโดยไม่มีการล็อกอิน (เปิด Incognito หรือลบคุกกี้ออกก่อนรัน)
// คาดหวัง: Status: 401 Unauthorized, คืนค่า { error: "Unauthorized" }
// ----------------------------------------------------
await fetch(`/api/favorites?recipeId=${targetRecipeId}&action=status`, { credentials: "omit" })
  .then(async (res) => console.log("Get Favorite Status (No Auth) - Status:", res.status, "Body:", await res.json().catch(() => null)));


// 1.3 ค้นหาสถานะด้วย recipeId ที่ไม่มีจริงในระบบ
// คาดหวัง: Status: 404 Not Found, คืนค่า { error: "Recipe not found" }
// ----------------------------------------------------
await fetch(`/api/favorites?recipeId=a2f3c7c4-07e3-41c8-bfbe-494d014982b2&action=status`)
  .then(async (res) => console.log("Get Favorite Status (Not Found) - Status:", res.status, "Body:", await res.json()));


// 1.4 ส่งค่า recipeId ที่ไม่ใช่รูปแบบ UUID
// คาดหวัง: Status: 400 Bad Request, คืนค่า { error: "Invalid recipe ID" }
// ----------------------------------------------------
await fetch(`/api/favorites?recipeId=invalid-uuid-format&action=status`)
  .then(async (res) => console.log("Get Favorite Status (Invalid UUID) - Status:", res.status, "Body:", await res.json()));


// 1.5 ส่งชื่อ action ที่ไม่ถูกต้อง
// คาดหวัง: Status: 400 Bad Request, คืนค่า { error: "Invalid action. Must be 'status' or 'count'" }
// ----------------------------------------------------
await fetch(`/api/favorites?recipeId=${targetRecipeId}&action=invalid_action`)
  .then(async (res) => console.log("Get Favorite (Invalid Action) - Status:", res.status, "Body:", await res.json()));


/* ================= 2. GET FAVORITE COUNT (Public API) ================= */

// 2.1 ดึงจำนวนผู้ใช้ที่กด Favorite สูตรนี้ทั้งหมด (ไม่ต้องล็อกอินก็เข้าถึงได้)
// คาดหวัง: Status: 200 OK, คืนค่า { data: { recipeId: "...", count: [ตัวเลขจำนวน] } }
// ----------------------------------------------------
await fetch(`/api/favorites?recipeId=${targetRecipeId}&action=count`)
  .then(async (res) => console.log("Get Favorite Count - Status:", res.status, "Body:", await res.json()));


// 2.2 ดึงจำนวน Favorite โดยไม่มีการล็อกอิน
// คาดหวัง: Status: 200 OK, คืนค่าข้อมูลแบบสาธารณะได้ตามปกติ
// ----------------------------------------------------
await fetch(`/api/favorites?recipeId=${targetRecipeId}&action=count`, { credentials: "omit" })
  .then(async (res) => console.log("Get Favorite Count (No Auth) - Status:", res.status, "Body:", await res.json()));


// 2.3 ดึงจำนวน Favorite ของสูตรอาหารที่ไม่มีอยู่จริงในระบบ
// คาดหวัง: Status: 404 Not Found, คืนค่า { error: "Recipe not found" }
// ----------------------------------------------------
await fetch(`/api/favorites?recipeId=a2f3c7c4-07e3-41c8-bfbe-494d014982b2&action=count`)
  .then(async (res) => console.log("Get Favorite Count (Not Found) - Status:", res.status, "Body:", await res.json()));
