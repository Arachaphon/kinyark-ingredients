/* ============================================================
   Manual Console Test Cases - Iteration 2 W2-6 Calculate & Get Recipe Rating
   ============================================================
   Copy and run these scripts in the browser console (DevTools)
   to test rating calculations (rounding, updates, deletions)
   and the ratings summary breakdown API.
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


/* ================= 2. VERIFY TRANSACTIONAL DELETIONS & RATING UPDATES ================= */

// 2.1 ลบรีวิว / คะแนนเรตติ้ง (ต้องรันตอนล็อกอิน และใช้ไอดีรีวิวที่คุณเป็นผู้สร้างและมีอยู่จริง)
// หมายเหตุ: เมื่อรันสำเร็จ ยอด reviewCount จะลดลง 1 และ averageRating จะถูกคำนวณใหม่โดยอัตโนมัติ
// ----------------------------------------------------
const targetReviewId = "ใส่_REAL_REVIEW_UUID_ตรงนี้"; // แทนค่าด้วยไอดีรีวิวที่ต้องการลบ

await fetch(`/api/reviews/${targetReviewId}`, {
  method: "DELETE"
}).then(async (res) => console.log("Delete Review - Status:", res.status, "Body:", await res.json()));
