// k6/breaking-point-read.js
// จุดประสงค์: หา "จำนวน VUs ที่ระบบรองรับได้" และ "VUs ที่เริ่มทำให้ performance ลดลง"
// สำหรับฝั่งอ่านข้อมูล (GET) — เทส 4 endpoint หลักที่คนเข้าเว็บใช้บ่อยที่สุด
//
// ต่างจาก stress.js/spike.js เดิมตรงที่: ไล่ VUs เป็น "ขั้นบันได" ชัดเจน
// (ramp ขึ้นเร็ว 5s แล้ว hold นิ่ง 25s ต่อระดับ) แทนการ ramp ต่อเนื่อง
// เพื่อให้ analyze-breaking-point.mjs แยกผลตามแต่ละระดับ VUs ได้แม่นยำ
// ไม่ปนกันระหว่างช่วงเปลี่ยนระดับ
//
// วิธีรัน:
//   k6 run k6/breaking-point-read.js -e BASE_URL=http://localhost:3000 ^
//     --out json=outputs/breaking-point-read-raw.json
//
// วิเคราะห์ผล + สร้างกราฟ:
//   node k6/analyze-breaking-point.mjs outputs/breaking-point-read-raw.json outputs/breaking-point-read-report.html
//
// ข้อควรระวัง: รันเฉพาะ localhost/staging เท่านั้น ห้ามยิงใส่ production

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:3000';

// ---------- ระดับ VUs ที่จะไล่ทดสอบ ----------
// ปรับตัวเลขในนี้ได้ตามต้องการ (เช่นถ้าเครื่อง dev แรงน้อย ลดเพดานลงมาที่ 150-200 ก็พอ)
const LEVELS = [10, 25, 50, 75, 100, 150, 200, 250, 300];

// สร้าง stages แบบ "ramp เร็ว + hold นิ่ง" ต่อระดับ:
//   - 5s  ramp จากระดับก่อนหน้า ขึ้นไปที่ target ใหม่
//   - 25s hold นิ่งที่ target นั้น (ช่วงนี้แหละที่เอาไปคำนวณ p95/avg ต่อระดับ)
const stages = [];
for (const target of LEVELS) {
  stages.push({ duration: '5s', target });
  stages.push({ duration: '25s', target });
}
stages.push({ duration: '15s', target: 0 }); // ramp-down ปิดท้าย

export const options = {
  scenarios: {
    breaking_point_read: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages,
      gracefulRampDown: '10s',
    },
  },
  // เกณฑ์อ้างอิง (คาดหวังว่าจะ "แตก" ที่ VUs สูงๆ — เป็นผลลัพธ์ปกติของเทสนี้ ไม่ใช่ script พัง
  // ถ้าเห็น ERRO thresholds...crossed ตอนจบ แปลว่าเทสทำงานถูกต้องแล้ว)
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

// 4 endpoint หลักที่เป็นตัวแทนพฤติกรรม "เข้าดูเว็บ" ของผู้ใช้จริง
const TARGETS = [
  { name: 'health', url: `${BASE}/api/health` },
  { name: 'ingredients', url: `${BASE}/api/ingredients` },
  { name: 'search', url: `${BASE}/api/search?q=${encodeURIComponent('ไข่')}` },
  { name: 'recipes', url: `${BASE}/api/recipes?page=1&limit=12` },
];

export default function () {
  const t = TARGETS[Math.floor(Math.random() * TARGETS.length)];
  const res = http.get(t.url, { tags: { name: t.name, endpoint: t.name } });
  check(res, { [`${t.name} status 200`]: (r) => r.status === 200 });
  sleep(0.5);
}
