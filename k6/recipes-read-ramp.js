// ============================================================
// k6 Load Test — READ-heavy: GET /api/recipes
// Next.js + Prisma + PostgreSQL
//
// วิธีรัน:
//   k6 run --out json=outputs/k6-read-raw.json k6/recipes-read-ramp.js
//   BASE_URL เอง: k6 run -e BASE_URL=http://localhost:3000 --out json=outputs/k6-read-raw.json k6/recipes-read-ramp.js
//
// ผลลัพธ์:
//   1. outputs/k6-read-raw.json  (raw events ทุก request → เอาไป plot กราฟ VUs vs response time)
//   2. outputs/k6-read-summary.json (สรุป avg/p95/p99/error/rps → เอาไปทำตารางข้อ 6)
// ============================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ---------- 1. Config พื้นฐาน ----------
// BASE_URL รับจาก env (-e BASE_URL=...) ถ้าไม่ส่งมา default เป็น localhost
const BASE = __ENV.BASE_URL || 'http://localhost:3000';

// ---------- 2. Custom metrics (เสริมจาก built-in) ----------
// Trend เก็บค่า response time แยก tag ต่อ endpoint → ดู p95/p99 แยก read ได้
const readDuration = new Trend('read_duration_ms');
// Rate เก็บสัดส่วน request ที่ fail (0 = ผ่าน, 1 = พัง)
const readErrors = new Rate('read_errors');
// Counter นับจำนวน request ทั้งหมด
const readCount = new Counter('read_requests_total');

// ---------- 3. Executor: ramping-vus ----------
// ไล่ VUs ทีละขั้น ขั้นละ 30s (ตามที่ approve):
//   10 → 20 → 50 → 100 → 200 → 300 → 500 แล้ว ramp-down ลง 0
// แต่ละ stage k6 จะค่อยๆ เพิ่ม/ลด VU แบบ linear ภายใน duration นั้น
export const options = {
  scenarios: {
    read_ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '30s', target: 20 },
        { duration: '30s', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '30s', target: 200 },
        { duration: '30s', target: 300 }, // <-- ขั้นที่เพิ่มมาตาม request
        { duration: '30s', target: 500 },
        { duration: '30s', target: 0 }, // ramp-down ให้ connection คลายตัว
      ],
      gracefulRampDown: '10s',
    },
  },

  // ---------- 4. Thresholds (เกณฑ์ pass/fail) ----------
  // ถ้าเกิน = k6 exit code != 0 → ถือว่าจุดนั้น performance เริ่มตก
  // summaryTrendStats ต้องมี p(99) ด้วย ไม่งั้น handleSummary จะอ่าน
  // values['p(99)'] ได้ undefined (k6 default คำนวณแค่ถึง p(95))
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'], // p95 < 500ms (req), p99 ไว้ดูหาง
    http_req_failed: ['rate<0.01'], // error rate < 1%
    checks: ['rate>0.99'], // check ต้องผ่าน > 99%
    read_duration_ms: ['p(95)<500'], // เกณฑ์เดียวกันบน custom metric
    read_errors: ['rate<0.01'],
  },
};

// ---------- 5. Warmup (ยิง 1 รอบก่อนเทสจริง) ----------
// อุ่น JIT / connection pool / Prisma / cache จะได้ไม่วัด cold-start ปน
export function setup() {
  http.get(`${BASE}/api/recipes?page=1&limit=12&publicOnly=true`);
}

// ---------- 6. VU function (read-heavy) ----------
// สุ่ม page/limit เพื่อกระจาย query และเลี่ยง cache hit 100%
// (GET /api/recipes มี cache.getOrSet('recipes:list:...') ฝั่ง server)
export default function () {
  const page = Math.floor(Math.random() * 5) + 1; // 1-5
  const limit = [10, 12, 20][Math.floor(Math.random() * 3)];
  const url = `${BASE}/api/recipes?page=${page}&limit=${limit}&publicOnly=true`;

  const res = http.get(url, {
    tags: { endpoint: 'recipes-read', vu_level: String(__VU) },
  });

  // เก็บ metrics
  readDuration.add(res.timings.duration);
  readErrors.add(res.status !== 200 ? 1 : 0);
  readCount.add(1);

  // ตรวจผล
  check(res, {
    'read: status 200': (r) => r.status === 200,
    'read: has data': (r) => {
      try {
        return Array.isArray(r.json('data'));
      } catch {
        return false;
      }
    },
    'read: p95 guard <500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // think time 1s จำลอง user อ่านหน้าเว็บ
}

// ---------- 7. Export สรุปเป็น JSON ----------
// k6 จะเรียกฟังก์ชันนี้ตอนจบ → เขียนไฟล์ summary สำหรับทำตาราง
// (ต้องรันคู่กับ --out json=... ถ้าอยากได้ raw ด้วย ดูหัวไฟล์)
//
// หมายเหตุ: ผล threshold ราย metric อยู่ใน data.metrics[name].thresholds
// (ไม่มี data.thresholds ระดับบน — เช็คตรงนั้นจะได้ true เสมอ)
function thresholdsPassed(metrics) {
  for (const m of Object.values(metrics)) {
    for (const t of Object.values(m.thresholds || {})) {
      const ok = typeof t === 'object' && t !== null ? t.ok : t;
      if (ok === false) return false;
    }
  }
  return true;
}

export function handleSummary(data) {
  const m = data.metrics;
  const summary = {
    endpoint: 'GET /api/recipes',
    thresholds_passed: thresholdsPassed(m),
    avg_ms: m.http_req_duration?.values?.avg ?? null,
    p95_ms: m.http_req_duration?.values?.['p(95)'] ?? null,
    p99_ms: m.http_req_duration?.values?.['p(99)'] ?? null,
    error_rate: m.http_req_failed?.values?.rate ?? null,
    checks_rate: m.checks?.values?.rate ?? null,
    total_requests: m.http_reqs?.values?.count ?? null,
    requests_per_sec: m.http_reqs?.values?.rate ?? null,
    vus_max: m.vus_max?.values?.max ?? null,
  };
  return {
    'outputs/k6-read-summary.json': JSON.stringify(summary, null, 2),
    stdout: `\n[read] avg=${summary.avg_ms?.toFixed(1)}ms p95=${summary.p95_ms?.toFixed(1)}ms `
      + `p99=${summary.p99_ms?.toFixed(1)}ms err=${((summary.error_rate ?? 0) * 100).toFixed(2)}% `
      + `rps=${summary.requests_per_sec?.toFixed(1)}\n`,
  };
}

// ---------- 8. เอา raw JSON ไป plot กราฟ ----------
// raw file (outputs/k6-read-raw.json) เป็น JSON Lines ทีละบรรทัด:
//   {"metric":"http_req_duration","data":{"value":123.4,"tags":{"vu_level":"50"}},...}
// ตัวอย่างดึง VUs vs p95 ด้วย jq:
//   cat outputs/k6-read-raw.json | jq -s '...'
// หรือใช้ python pandas: pd.read_json(..., lines=True) แล้ว groupby tags.vu_level
// ตารางสรุป (กรอกหลังรัน):
// | VUs | avg | p95 | error% | rps |
