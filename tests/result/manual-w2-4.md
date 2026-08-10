/* ============================================================
   Manual Console Test Cases - Iteration 2 W2-4 Update & Delete Review
   ============================================================ */

const targetReviewId = "ใส่_REAL_REVIEW_UUID_ตรงนี้"; // แทนค่าด้วยไอดีรีวิวที่ต้องการทดสอบและมีอยู่จริง


/* ================= 1. UPDATE REVIEW (PATCH) ================= */

// 1.1 แก้ไขคะแนนความคิดเห็นปกติ (Positive Case)
// คาดหวัง: Status: 200 OK, คืนค่าข้อมูลรีวิวที่ได้รับการอัปเดต และคำนวณคะแนนเฉลี่ยสูตรอาหารใหม่
// ----------------------------------------------------
await fetch(`/api/reviews/${targetReviewId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    rating: 4,
    comment: "ปรับปรุงคะแนนและคอมเมนต์เพิ่มเติมครับ!",
    isAnonymous: false
  })
}).then(async (res) => console.log("Update Review Result - Status:", res.status, "Body:", await res.json()));


// 1.2 แก้ไขรีวิวโดยไม่ได้ล็อกอิน (เปิด Incognito หรือลบคุกกี้ออกก่อนรัน)
// คาดหวัง: Status: 401 Unauthorized, คืนค่า { error: "Unauthorized" }
// ----------------------------------------------------
await fetch(`/api/reviews/${targetReviewId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ rating: 5 }),
  credentials: "omit"
}).then(async (res) => console.log("Update Review (No Auth) - Status:", res.status, "Body:", await res.json().catch(() => null)));


// 1.3 แก้ไขรีวิวของผู้อื่น (ต้องใช้บัญชีที่ไม่ได้เป็นคนเขียนรีวิวนี้)
// คาดหวัง: Status: 403 Forbidden, คืนค่า { error: "Forbidden" }
// ----------------------------------------------------
await fetch(`/api/reviews/${targetReviewId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ rating: 5 })
}).then(async (res) => console.log("Update Review (Not Owner) - Status:", res.status, "Body:", await res.json()));


// 1.4 แก้ไขโดยส่งคะแนนเกินกรอบ (มากกว่า 5 คะแนน)
// คาดหวัง: Status: 400 Bad Request, คืนค่าผิดพลาด Zod { error: "Rating must be at most 5" }
// ----------------------------------------------------
await fetch(`/api/reviews/${targetReviewId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ rating: 6 })
}).then(async (res) => console.log("Update Review (Invalid Rating) - Status:", res.status, "Body:", await res.json()));


/* ================= 2. DELETE REVIEW (DELETE) ================= */

// 2.1 ลบรีวิวของตนเองโดยไม่ได้ล็อกอิน (เปิด Incognito หรือลบคุกกี้ออกก่อนรัน)
// คาดหวัง: Status: 401 Unauthorized, คืนค่า { error: "Unauthorized" }
// ----------------------------------------------------
await fetch(`/api/reviews/${targetReviewId}`, {
  method: "DELETE",
  credentials: "omit"
}).then(async (res) => console.log("Delete Review (No Auth) - Status:", res.status, "Body:", await res.json().catch(() => null)));


// 2.2 ลบรีวิวของผู้อื่น (ต้องใช้บัญชีที่ไม่ได้เป็นคนเขียนรีวิวนี้)
// คาดหวัง: Status: 403 Forbidden, คืนค่า { error: "Forbidden" }
// ----------------------------------------------------
await fetch(`/api/reviews/${targetReviewId}`, {
  method: "DELETE"
}).then(async (res) => console.log("Delete Review (Not Owner) - Status:", res.status, "Body:", await res.json()));


// 2.3 ลบรีวิวของตนเองสำเร็จ (Positive Case)
// คาดหวัง: Status: 200 OK, คืนค่า { data: { id: "..." } }, reviewCount ลดลง 1, และคะแนนเฉลี่ยสูตรอาหารถูกคำนวณใหม่
// ----------------------------------------------------
await fetch(`/api/reviews/${targetReviewId}`, {
  method: "DELETE"
}).then(async (res) => console.log("Delete Review Result - Status:", res.status, "Body:", await res.json()));
