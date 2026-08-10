/* ============================================================
   Manual Console Test Cases - Iteration 2 W2-2 Create Review & Rating
   ============================================================
   Copy and run these scripts in the browser console (DevTools)
   to test the reviews POST endpoint in isolation.
   ============================================================ */

const targetRecipeId = "ใส่_REAL_RECIPE_UUID_ตรงนี้"; // แทนค่าด้วยไอดีสูตรอาหารที่มีอยู่ในระบบจริง

// 1. เขียนรีวิวสูตรอาหารปกติ (Positive Case)
// คาดหวัง: Status: 201 Created, คืนค่ารีวิวที่สร้างสำเร็จ และอัปเดตคะแนน/จำนวนรีวิวของสูตรอาหาร
// ----------------------------------------------------
await fetch("/api/reviews", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    recipeId: targetRecipeId,
    rating: 5,
    comment: "อร่อยมากครับ! ขั้นตอนทำตามได้ง่ายมากๆ",
    isAnonymous: false
  })
}).then(async (res) => console.log("Create Review - Status:", res.status, "Body:", await res.json()));


// 2. เขียนรีวิวโดยไม่เข้าสู่ระบบ (เปิด Incognito หรือลบคุกกี้ออกก่อนรัน)
// คาดหวัง: Status: 401 Unauthorized, คืนค่า { error: "Unauthorized" }
// ----------------------------------------------------
await fetch("/api/reviews", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    recipeId: targetRecipeId,
    rating: 5
  }),
  credentials: "omit"
}).then(async (res) => console.log("Create Review (No Auth) - Status:", res.status, "Body:", await res.json().catch(() => null)));


// 3. เขียนรีวิวโดยส่งคะแนนเกินกรอบ (มากกว่า 5 คะแนน)
// คาดหวัง: Status: 400 Bad Request, คืนค่าผิดพลาด Zod { error: "Rating must be at most 5" }
// ----------------------------------------------------
await fetch("/api/reviews", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    recipeId: targetRecipeId,
    rating: 6
  })
}).then(async (res) => console.log("Create Review (Invalid Rating) - Status:", res.status, "Body:", await res.json()));


// 4. เขียนรีวิวซ้ำบนเมนูเดิมที่เคยรีวิวไปแล้วในขั้นตอนที่ 1
// คาดหวัง: Status: 409 Conflict, คืนค่า { error: "You have already reviewed this recipe" }
// ----------------------------------------------------
await fetch("/api/reviews", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    recipeId: "62522073-dab1-4214-a195-59135f9d868d",
    rating: 4,
    comment: "ลองรีวิวซ้ำดูครับ"
  })
}).then(async (res) => console.log("Create Review (Duplicate) - Status:", res.status, "Body:", await res.json()));
