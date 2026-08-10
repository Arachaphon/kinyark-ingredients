/* ============================================================
   Manual Console Test Cases - Iteration 2 W2-6 Calculate & Get Recipe Rating
   ============================================================ */

const targetRecipeId = "ใส่_REAL_RECIPE_UUID_ตรงนี้"; // แทนค่าด้วยไอดีสูตรอาหารที่มีอยู่ในระบบจริง


/* ================= 1. GET RATINGS SUMMARY & STAR BREAKDOWN ================= */

// 1.1 ดึงสรุปผลคะแนนเฉลี่ย ยอดรีวิว และการแจกแจงจำนวนดาว 1-5 (Public API)
// คาดหวัง: Status: 200 OK, คืนค่า { data: { recipeId, averageRating, totalReviews, breakdown: { 5: x, 4: y... } } }
// ----------------------------------------------------
await fetch(`/api/recipes/${targetRecipeId}/ratings`)
  .then(async (res) => console.log("Get Ratings Breakdown - Status:", res.status, "Body:", await res.json()));


// 1.2 ค้นหาข้อมูลสูตรอาหารที่ไม่มีจริงในระบบ
// คาดหวัง: Status: 404 Not Found, คืนค่า { error: "Recipe not found" }
// ----------------------------------------------------
await fetch(`/api/recipes/a2f3c7c4-07e3-41c8-bfbe-494d014982b2/ratings`)
  .then(async (res) => console.log("Get Ratings (Not Found) - Status:", res.status, "Body:", await res.json()));



