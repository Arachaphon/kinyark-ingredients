# สรุปผล Load Test (k6) — Kinyark Ingredients API

**วันที่ทดสอบ:** กันยายน 2026 | **เครื่องมือ:** k6 (ramping-vus) | **สภาพแวดล้อม:** `next dev` + Supabase PostgreSQL (pooler, `connection_limit=10`)
**เกณฑ์:** p95 < 800ms และ error rate < 1% — ขั้นแรกที่หลุดเกณฑ์ = breaking point

## คำตอบตามโจทย์

| กลุ่ม | VUs ที่ระบบรองรับได้ | VUs ที่เริ่มตก | อาการ |
|---|---|---|---|
| Read (`GET` หลาย endpoint) | **50 VUs** (p95 640ms, error 0%) | **75 VUs** (p95 987ms) | ช้าลงแต่ไม่ล่ม — error 0% ยัน 300 VUs |
| Write (`POST /api/recipes`) | **ไม่มี** (ตกตั้งแต่ขั้นต่ำสุด) | **5 VUs** (ช้า) / **50 VUs** (เริ่ม error) | ช้าก่อน แล้วพ่น 500 + timeout |

## ผลรายขั้น

**Read** (VUs / avg / p95 / error%): 10→23/41/0% · 25→44/120/0% · **50→366/640/0%** · **75→776/987/0%** · 100→1207/1581/0% · 300→5092/5591/0%

**Write** (VUs / avg / p95 / error%): **5→1380/3390/0%** · 10→1167/1259/0% · 20→1739/9955/0% · **50→5070/11512/2.1%** · 100→10250/15426/16.2% · 150→13353/16981/43.6%

## ไฟล์หลักฐาน

- `outputs/breaking-point-read-report.html` / `breaking-point-write-report.html` — ตาราง + กราฟ (เปิดด้วยเบราว์เซอร์)
- `outputs/breaking-point-*-raw.json` — raw results จาก k6
- สคริปต์: `k6/breaking-point-read.js`, `k6/breaking-point-write.js`, `k6/analyze-breaking-point.mjs`

## ข้อจำกัดการทดลอง

1. รันบน `next dev` (ไม่ใช่ production build) + DB remote ผ่าน pooler — ตัวเลขนี้คือ**ขอบล่าง**ของระบบ
2. คอขวดฝั่ง write อยู่ที่ DB transaction + connection pool เต็ม (error 500 เริ่มที่ ~50 VUs, พุ่งเป็น 43.6% ที่ 150 VUs)
3. Read test ผสม 4 endpoints (รวม `/api/health` ที่เร็วมาก) — ค่า p95 รวมจึงดีกว่าการยิง `/api/recipes` เพียวๆ
