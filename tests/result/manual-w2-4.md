/* ============================================================
   Manual Console Test Cases - W2-4 Upload Recipe Image
   POST /api/recipes/upload
   ============================================================ */


/* ================= POSITIVE CASES ================= */

// ----------------------------------------------------
// 1. อัปโหลดรูปภาพ (image/jpeg)
// คาดหวัง: 200, { url: ... } เป็น public url ใน bucket recipes
// path ควรเป็นรูปแบบ <userId>/<uuid>.<ext>
// หมายเหตุ: ใช้ JPEG magic bytes จริง (FF D8 FF) ให้ผ่าน validateImageSignature
// ----------------------------------------------------
{
  const jpegBytes = new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
    0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
    0xff, 0xd9, // EOI marker
  ]);
  const file = new File([jpegBytes], 'test-image.jpg', { type: 'image/jpeg' });
  const formData = new FormData();
  formData.append('file', file);

  await fetch('/api/recipes/upload', { method: 'POST', body: formData })
    .then(async (res) => console.log('Status:', res.status, 'Body:', await res.json()));
}


// ----------------------------------------------------
// 2. อัปโหลดวิดีโอ (video/mp4)
// คาดหวัง: 200, { url: ... } ผ่าน validateVideoFile
// หมายเหตุ: ใช้ mp4 "ftyp" box header จริงให้ผ่าน signature check
// ----------------------------------------------------
{
  const mp4Bytes = new Uint8Array([
    0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, // size + 'ftyp'
    0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00,
    0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
  ]);
  const file = new File([mp4Bytes], 'test-video.mp4', { type: 'video/mp4' });
  const formData = new FormData();
  formData.append('file', file);

  await fetch('/api/recipes/upload', { method: 'POST', body: formData })
    .then(async (res) => console.log('Status:', res.status, 'Body:', await res.json()));
}


/* ================= NEGATIVE CASES ================= */

// ----------------------------------------------------
// 3. ไม่ได้เข้าสู่ระบบ
// คาดหวัง: 401 Unauthorized
// หมายเหตุ: ต้องทดสอบใน incognito / logout ก่อน หรือลบ auth cookie ก่อนรัน
// ----------------------------------------------------
{
  const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xd9]);
  const file = new File([jpegBytes], 'test-image.jpg', { type: 'image/jpeg' });
  const formData = new FormData();
  formData.append('file', file);

  await fetch('/api/recipes/upload', { method: 'POST', body: formData, credentials: 'omit' })
    .then(async (res) => console.log('Status:', res.status, 'Body:', await res.json().catch(() => null)));
}


// ----------------------------------------------------
// 4. ไม่มีไฟล์แนบ
// คาดหวัง: 400 No file provided
// ----------------------------------------------------
{
  const formData = new FormData(); // ไม่ append field 'file'

  await fetch('/api/recipes/upload', { method: 'POST', body: formData })
    .then(async (res) => console.log('Status:', res.status, 'Body:', await res.json()));
}


// ----------------------------------------------------
// 5. type ไฟล์ไม่ถูก (.txt / mime ไม่ตรง)
// คาดหวัง: 400 Invalid file type
// ----------------------------------------------------
{
  const file = new File(['plain text content'], 'test-file.txt', { type: 'text/plain' });
  const formData = new FormData();
  formData.append('file', file);

  await fetch('/api/recipes/upload', { method: 'POST', body: formData })
    .then(async (res) => console.log('Status:', res.status, 'Body:', await res.json()));
}


// ----------------------------------------------------
// 6. ไฟล์ใหญ่เกิน (ภาพ >5MB)
// คาดหวัง: 413 File too large
// หมายเหตุ: สร้างไฟล์ปลอมขนาด 6MB โดยเติม valid jpeg header ไว้ข้างหน้า
// ----------------------------------------------------
{
  const size = 6 * 1024 * 1024; // 6MB
  const bytes = new Uint8Array(size);
  // ใส่ jpeg header ไว้ข้างหน้าเพื่อให้ผ่าน signature check ก่อนโดนเช็คขนาด
  bytes.set([0xff, 0xd8, 0xff, 0xe0], 0);
  const file = new File([bytes], 'test-large-image.jpg', { type: 'image/jpeg' });
  const formData = new FormData();
  formData.append('file', file);

  await fetch('/api/recipes/upload', { method: 'POST', body: formData })
    .then(async (res) => console.log('Status:', res.status, 'Body:', await res.json()));
}


// ----------------------------------------------------
// 6b. ไฟล์วิดีโอใหญ่เกิน (>50MB)
// คาดหวัง: 413 File too large
// หมายเหตุ: ไฟล์ใหญ่ อาจใช้เวลาสักครู่ในการสร้าง/ส่ง
// ----------------------------------------------------
{
  const size = 51 * 1024 * 1024; // 51MB
  const bytes = new Uint8Array(size);
  bytes.set([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], 0); // mp4 ftyp header
  const file = new File([bytes], 'test-large-video.mp4', { type: 'video/mp4' });
  const formData = new FormData();
  formData.append('file', file);

  await fetch('/api/recipes/upload', { method: 'POST', body: formData })
    .then(async (res) => console.log('Status:', res.status, 'Body:', await res.json()));
}


// ----------------------------------------------------
// 7. เนื้อไฟล์ไม่ตรงกับ mime type (signature mismatch)
// คาดหวัง: 400 File content does not match
// หมายเหตุ: ตั้ง mime เป็น image/jpeg แต่เนื้อไฟล์จริงเป็น plain text (ไม่มี jpeg magic bytes)
// ----------------------------------------------------
{
  const fakeBytes = new TextEncoder().encode('this is not actually a jpeg file');
  const file = new File([fakeBytes], 'fake-image.jpg', { type: 'image/jpeg' });
  const formData = new FormData();
  formData.append('file', file);

  await fetch('/api/recipes/upload', { method: 'POST', body: formData })
    .then(async (res) => console.log('Status:', res.status, 'Body:', await res.json()));
}


// ----------------------------------------------------
// 8. type ที่ไม่รองรับ (ไม่ map เป็น extension เช่น image/x-icon)
// คาดหวัง: 400 Unsupported file type
// ----------------------------------------------------
{
  const icoBytes = new Uint8Array([0x00, 0x00, 0x01, 0x00]); // ICO header
  const file = new File([icoBytes], 'test-icon.ico', { type: 'image/x-icon' });
  const formData = new FormData();
  formData.append('file', file);

  await fetch('/api/recipes/upload', { method: 'POST', body: formData })
    .then(async (res) => console.log('Status:', res.status, 'Body:', await res.json()));
}