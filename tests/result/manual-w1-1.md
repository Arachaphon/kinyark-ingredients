/* ============================================================
   Manual Console Test Cases - Iteration 2 W1-1 Manage Recipe Video
   ============================================================
   ============================================================ */

/* ================= 1. VIDEO UPLOAD TESTS ================= */

// 1.1 อัปโหลดวิดีโอประเภทที่ถูกต้อง (MP4/WebM/MOV) ขนาดไม่เกิน 50MB
// คาดหวัง: Status: 200 OK, Body คืนค่า { url: "https://.../video.mp4" }
// ----------------------------------------------------
const validVideoBlob = new Blob(["mock-video-content-here"], { type: "video/mp4" });
const validVideoFile = new File([validVideoBlob], "test-video.mp4", { type: "video/mp4" });
const uploadFormData = new FormData();
uploadFormData.append("file", validVideoFile);

const uploadRes = await fetch("/api/recipes/upload", {
  method: "POST",
  body: uploadFormData,
}).then(res => res.json());

console.log("Upload Result:", uploadRes);
const videoUrl = uploadRes.url; 


// 1.2 อัปโหลดวิดีโอขนาดเกินขีดจำกัด (เกิน 50MB)
// คาดหวัง: Status: 413 Payload Too Large, Body คืนค่า { error: "File too large. Maximum size is 50 MB" }
// ----------------------------------------------------
const hugeVideoBlob = new Blob([new Uint8Array(51 * 1024 * 1024)], { type: "video/mp4" });
const hugeVideoFile = new File([hugeVideoBlob], "huge-video.mp4", { type: "video/mp4" });
const hugeFormData = new FormData();
hugeFormData.append("file", hugeVideoFile);

await fetch("/api/recipes/upload", {
  method: "POST",
  body: hugeFormData,
}).then(async (res) => console.log("Upload Huge Video - Status:", res.status, "Body:", await res.json()));


// 1.3 อัปโหลดไฟล์วิดีโอประเภทที่ไม่รองรับ (เช่น video/avi)
// คาดหวัง: Status: 400 Bad Request, Body คืนค่า { error: "Invalid file type. Allowed: MP4, MOV, WebM" }
// ----------------------------------------------------
const invalidVideoBlob = new Blob(["mock-video-content"], { type: "video/avi" });
const invalidVideoFile = new File([invalidVideoBlob], "test.avi", { type: "video/avi" });
const invalidFormData = new FormData();
invalidFormData.append("file", invalidVideoFile);

await fetch("/api/recipes/upload", {
  method: "POST",
  body: invalidFormData,
}).then(async (res) => console.log("Upload Unsupported Video - Status:", res.status, "Body:", await res.json()));


/* ================= 2. RECIPE WITH VIDEO CRUD TESTS ================= */

// 2.1 สร้างสูตรอาหารที่มีการผูกวิดีโอที่อัปโหลด
// คาดหวัง: Status: 201 Created, บันทึกสูตรพร้อมความสัมพันธ์ RecipeVideo สำเร็จ
// ----------------------------------------------------
const createRecipeRes = await fetch('/api/recipes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipeName: 'สูตรอาหารทดสอบระบบวิดีโอ',
    description: 'ทดสอบความปลอดภัยและการเล่นวิดีโอ',
    ingredients: [
      { name: 'ไก่', quantity: 200, unit: 'g' }
    ],
    videos: [videoUrl || "https://example.com/mock-video.mp4"],
    visibility: 'public'
  }),
}).then(res => res.json());

console.log("Create Recipe with Video Result:", createRecipeRes);
const newRecipeId = createRecipeRes.data.id;


// 2.2 ดึงข้อมูลสูตรอาหารเพื่อตรวจสอบว่ามีวิดีโอแนบอยู่จริง
// คาดหวัง: Status: 200 OK, Body คืนค่ารายละเอียดสูตรที่มีอาเรย์ videos ประกอบด้วย URL วิดีโอ
// ----------------------------------------------------
await fetch(`/api/recipes/${newRecipeId}`)
  .then(res => res.json())
  .then(data => console.log("Fetched Recipe Videos:", data.data.videos));


// 2.3 อัปเดตสูตรอาหารเพื่อลบหรือเปลี่ยนแปลงวิดีโอ (PATCH)
// คาดหวัง: Status: 200 OK, วิดีโอถูกลบออก หรือเปลี่ยนเป็น URL อื่น
// ----------------------------------------------------
await fetch(`/api/recipes/${newRecipeId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    videos: [] // สั่งลบวิดีโอออกทั้งหมด
  }),
}).then(async (res) => console.log("Update Recipe (Delete Video) - Status:", res.status, "Body:", await res.json()));