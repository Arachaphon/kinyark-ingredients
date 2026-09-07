// ============================================================
// k6 Load Test — WRITE-heavy: POST /api/recipes
// Next.js + Prisma + PostgreSQL
//
// วิธีรัน (ต้องมี auth ของ load-test user ทุกครั้ง):
//   k6 run -e K6_AUTH_EMAIL=k6loadtest001@example.com -e K6_AUTH_PASSWORD=... `
//     -e SUPABASE_URL=https://xxx.supabase.co -e SUPABASE_ANON_KEY=xxx `
//     --out json=outputs/k6-write-raw.json k6/recipes-write-ramp.js
//
// หมายเหตุ auth: proxy (src/proxy.ts) ลบ header x-user-id ที่ client ส่งมาทิ้ง
// (กัน spoof) แล้วตั้งใหม่จาก Supabase session ใน cookie เท่านั้น → k6 ต้อง
// login ผ่าน Auth API แล้วส่ง session cookie กลับไป (ดู setup() ข้างล่าง)
//
// หลังเทส: ลบร่องรอยด้วย k6/cleanup.sql (recipeName LIKE 'k6-load-%')
//
// ผลลัพธ์:
//   1. outputs/k6-write-raw.json     (raw events → plot VUs vs response time)
//   2. outputs/k6-write-summary.json (สรุป avg/p95/p99/error/rps → ทำตาราง)
// ============================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import encoding from 'k6/encoding';

// ---------- 1. Config พื้นฐาน ----------
const BASE = __ENV.BASE_URL || 'http://localhost:3000';
// Auth ของ load-test user (สมัครแยกเฉพาะไว้เทส ห้ามใช้ user จริงของคนอื่น)
const AUTH_EMAIL = __ENV.K6_AUTH_EMAIL || '';
const AUTH_PASSWORD = __ENV.K6_AUTH_PASSWORD || '';
const SUPABASE_URL = __ENV.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';

// ---------- 2. Custom metrics ----------
const writeDuration = new Trend('write_duration_ms');
const writeErrors = new Rate('write_errors');
const writeCount = new Counter('write_requests_total');

// ---------- 3. Executor: ramping-vus (ขั้นละ 30s) ----------
// 10 → 20 → 50 → 100 → 200 → 300 → 500 + ramp-down
// หมายเหตุ: write สร้าง row จริงใน DB ทุก request — อย่ายิง production
export const options = {
  scenarios: {
    write_ramp: {
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
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },

  // ---------- 4. Thresholds ----------
  // summaryTrendStats ต้องมี p(99) ด้วย ไม่งั้น handleSummary จะอ่าน
  // values['p(99)'] ได้ undefined (k6 default คำนวณแค่ถึง p(95))
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
    write_duration_ms: ['p(95)<500'],
    write_errors: ['rate<0.01'],
  },
};

// ---------- 5. Login + สร้าง session cookie (รันครั้งเดียวก่อนเทส) ----------
// ขอ token ผ่าน Supabase Auth API (password grant) แล้วห่อเป็น cookie
// ชื่อ sb-<ref>-auth-token รูปแบบ base64-<base64url(session JSON)> ตามที่
// @supabase/ssr อ่าน (ดู node_modules/@supabase/ssr/dist/main/cookies.js)
// proxy จะได้ getSession() เจอ → verify JWT → ตั้ง x-user-id ให้เอง
export function setup() {
  for (const v of [AUTH_EMAIL, AUTH_PASSWORD, SUPABASE_URL, SUPABASE_ANON_KEY]) {
    if (!v) {
      throw new Error(
        'Missing auth env. Run with: k6 run -e K6_AUTH_EMAIL=... -e K6_AUTH_PASSWORD=... ' +
        '-e SUPABASE_URL=... -e SUPABASE_ANON_KEY=... k6/recipes-write-ramp.js'
      );
    }
  }
  // warmup: GET 1 ครั้งเช็คว่า server ตอบ (ไม่ POST ตอน warmup เพื่อไม่สร้างขยะ)
  http.get(`${BASE}/api/health`);

  const login = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email: AUTH_EMAIL, password: AUTH_PASSWORD }),
    { headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' } }
  );
  if (login.status !== 200) {
    throw new Error(`Supabase login failed: ${login.status} ${login.body}`.slice(0, 300));
  }
  const tok = login.json();
  const session = {
    access_token: tok.access_token,
    refresh_token: tok.refresh_token,
    expires_at: tok.expires_at,
    expires_in: tok.expires_in,
    token_type: tok.token_type || 'bearer',
    user: tok.user,
  };
  // ref คือ subdomain ของ https://<ref>.supabase.co
  const ref = SUPABASE_URL.replace(/^https?:\/\//, '').split('.')[0];
  const cookieName = `sb-${ref}-auth-token`;
  const cookieValue = 'base64-' + encoding.b64encode(JSON.stringify(session), 'url');
  return { cookieName, cookieValue };
}

// ---------- 6. สร้าง payload ให้ผ่าน Zod (createRecipeSchema) ----------
// recipeName 1-150 ตัว, ingredients อย่างน้อย 1 ตัว {name, quantity>0, unit}
// ใช้ visibility='private' + prefix 'k6-load-' → ไม่หลุดไป public feed + ลบง่าย
function buildPayload() {
  const uniq = `${__VU}-${__ITER}-${Date.now()}`;
  return JSON.stringify({
    recipeName: `k6-load-${uniq}`.slice(0, 100),
    description: 'k6 load test recipe (auto-generated, safe to delete)'.slice(0, 200),
    instructions: 'Mix and cook.'.slice(0, 500),
    ingredients: [
      { name: 'k6 test egg', quantity: 2, unit: 'pcs' },
      { name: 'k6 test flour', quantity: 100, unit: 'g' },
    ],
    visibility: 'private',
  });
}

// ---------- 7. VU function (write-heavy) ----------
// data คือค่าที่ setup() return (cookie session) — k6 ส่งมาให้ทุก VU
export default function (data) {
  const params = {
    headers: { 'Content-Type': 'application/json' },
    cookies: { [data.cookieName]: data.cookieValue }, // session cookie → proxy ตรวจแล้วตั้ง x-user-id ให้
    tags: { endpoint: 'recipes-write', vu_level: String(__VU) },
  };

  const res = http.post(`${BASE}/api/recipes`, buildPayload(), params);

  writeDuration.add(res.timings.duration);
  // POST สำเร็จต้องได้ 201; นอกนั้นนับเป็น error
  const ok = res.status === 201;
  writeErrors.add(ok ? 0 : 1);
  writeCount.add(1);

  check(res, {
    'write: status 201': (r) => r.status === 201,
    'write: returns data.id': (r) => {
      try {
        return !!r.json('data')?.id;
      } catch {
        return false;
      }
    },
    'write: p95 guard <500ms': (r) => r.timings.duration < 500,
  });

  sleep(2); // think time นานกว่า read (2s) เพื่อไม่ให้ DB บวมเร็วเกินไป
}

// ---------- 8. Export สรุปเป็น JSON ----------
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
    endpoint: 'POST /api/recipes',
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
    'outputs/k6-write-summary.json': JSON.stringify(summary, null, 2),
    stdout: `\n[write] avg=${summary.avg_ms?.toFixed(1)}ms p95=${summary.p95_ms?.toFixed(1)}ms `
      + `p99=${summary.p99_ms?.toFixed(1)}ms err=${((summary.error_rate ?? 0) * 100).toFixed(2)}% `
      + `rps=${summary.requests_per_sec?.toFixed(1)}\n`,
  };
}

// ---------- 9. เอา raw JSON ไป plot / ทำตาราง ----------
// jq ตัวอย่าง (แยกตาม vu_level):
//   cat outputs/k6-write-raw.json | jq -s '...'
// ตารางสรุป (กรอกหลังรัน):
// | VUs | avg | p95 | error% | rps |
// จำไว้: รัน cleanup หลังเทสทุกครั้ง → psql $DATABASE_URL -f k6/cleanup.sql
