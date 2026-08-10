/* ============================================================
   Manual Console Test Cases - W2-1 Validate Recipe Data
   ============================================================ */


/* ================= POSITIVE CASES ================= */

// ----------------------------------------------------
// 1. ข้อมูล recipe ที่ถูกต้องผ่าน validation
// คาดหวัง: 200/201, สร้าง recipe สำเร็จ
// ----------------------------------------------------
await fetch('/api/recipes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipeName: 'ข้าวผัดกะเพรา',
    description: 'เมนูง่ายๆ ทำเร็ว',
    ingredients: [
      { name: 'ไก่สับ', quantity: 200, unit: 'g' },
      { name: 'ใบกะเพรา', quantity: 20, unit: 'g' },
    ],
    visibility: 'public',
  }),
}).then(async (res) => console.log('Status:', res.status, 'Body:', await res.json()));


// ----------------------------------------------------
// 2. featuredImageUrl เป็น URL ที่ถูกต้อง
// คาดหวัง: 200/201 , คาดหวัง: ผ่าน validation
// ----------------------------------------------------
await fetch('/api/recipes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipeName: 'ผัดไทย',
    ingredients: [{ name: 'เส้นจันท์', quantity: 100, unit: 'g' }],
    featuredImageUrl: 'https://example.com/img.jpg',
  }),
}).then(async (res) => console.log('Status:', res.status, 'Body:', await res.json()));


// ----------------------------------------------------
// 3. update ข้อมูลบาง field (PATCH)
// แก้ RECIPE_ID เป็น id จริงก่อนรัน
// คาดหวัง: updateRecipeSchema ยอมรับ partial update
// ----------------------------------------------------
await fetch('/api/recipes/f7d19bb6-3627-48c6-937e-dd3a22180794', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'อัปเดตคำอธิบายใหม่',
  }),
}).then(async (res) => console.log('Status:', res.status, 'Body:', await res.json()));


/* ================= NEGATIVE CASES ================= */

// ----------------------------------------------------
// 4. recipeName ว่าง
// คาดหวัง: 400 Bad Request
// ----------------------------------------------------
await fetch('/api/recipes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipeName: '',
    ingredients: [{ name: 'ไก่', quantity: 1, unit: 'kg' }],
  }),
}).then(async (res) => console.log('Status:', res.status, 'Body:', await res.json()));


// ----------------------------------------------------
// 5. recipeName ยาวเกิน 150 ตัวอักษร
// คาดหวัง: reject (max 150)
// ----------------------------------------------------
await fetch('/api/recipes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipeName: 'ก'.repeat(151),
    ingredients: [{ name: 'ไก่', quantity: 1, unit: 'kg' }],
  }),
}).then(async (res) => console.log('Status:', res.status, 'Body:', await res.json()));


// ----------------------------------------------------
// 6. featuredImageUrl ไม่ใช่ URL
// คาดหวัง: reject
// ----------------------------------------------------
await fetch('/api/recipes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipeName: 'ทดสอบ',
    ingredients: [{ name: 'ไก่', quantity: 1, unit: 'kg' }],
    featuredImageUrl: 'not-a-url',
  }),
}).then(async (res) => console.log('Status:', res.status, 'Body:', await res.json()));


// ----------------------------------------------------
// 7. ingredients ว่าง
// คาดหวัง: reject ("add at least one ingredient")
// ----------------------------------------------------
await fetch('/api/recipes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipeName: 'ทดสอบ',
    ingredients: [],
  }),
}).then(async (res) => console.log('Status:', res.status, 'Body:', await res.json()));


// ----------------------------------------------------
// 8. quantity ติดลบ
// คาดหวัง: reject
// ----------------------------------------------------
await fetch('/api/recipes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipeName: 'ทดสอบ',
    ingredients: [{ name: 'ไก่', quantity: -1, unit: 'kg' }],
  }),
}).then(async (res) => console.log('Status:', res.status, 'Body:', await res.json()));


// ----------------------------------------------------
// 9. visibility ไม่อยู่ใน enum
// คาดหวัง: reject
// ----------------------------------------------------
await fetch('/api/recipes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipeName: 'ทดสอบ',
    ingredients: [{ name: 'ไก่', quantity: 1, unit: 'kg' }],
    visibility: 'secret',
  }),
}).then(async (res) => console.log('Status:', res.status, 'Body:', await res.json()));


// ----------------------------------------------------
// 10. store.sellingPrice ติดลบ / storeName ว่าง
// คาดหวัง: reject
// ----------------------------------------------------
await fetch('/api/recipes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipeName: 'ทดสอบ',
    ingredients: [{ name: 'ไก่', quantity: 1, unit: 'kg' }],
    store: { storeName: '', sellingPrice: -5 },
  }),
}).then(async (res) => console.log('Status:', res.status, 'Body:', await res.json()));


// ----------------------------------------------------
// 11. systemRecipeId / referenceRecipeId ไม่ใช่ UUID
// คาดหวัง: reject
// ----------------------------------------------------
await fetch('/api/recipes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipeName: 'ทดสอบ',
    ingredients: [{ name: 'ไก่', quantity: 1, unit: 'kg' }],
    systemRecipeId: 'nope',
  }),
}).then(async (res) => console.log('Status:', res.status, 'Body:', await res.json()));