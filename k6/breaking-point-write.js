// k6/breaking-point-write.js
// เหมือน breaking-point-read.js แต่เทสฝั่งเขียนข้อมูล (POST /api/recipes)
// ใช้ auth pattern เดียวกับ recipes-write-ramp.js เดิม (login ครั้งเดียวใน setup()
// แล้วส่ง Supabase session cookie ไปทุก VU — ไม่ได้ login ซ้ำทุก request)
//
// วิธีรัน (ต้องเตรียม load-test user ใน Supabase ไว้ก่อน เหมือนที่ใช้อยู่แล้ว):
//   k6 run k6/breaking-point-write.js -e BASE_URL=http://localhost:3000 ^
//     -e K6_AUTH_EMAIL=k6loadtest001@example.com -e K6_AUTH_PASSWORD=LoadTest1234!x ^
//     -e SUPABASE_URL=%SUPABASE_URL% -e SUPABASE_ANON_KEY=%SUPABASE_ANON_KEY% ^
//     --out json=outputs/breaking-point-write-raw.json
//
// วิเคราะห์ผล + สร้างกราฟ:
//   node k6/analyze-breaking-point.mjs outputs/breaking-point-write-raw.json outputs/breaking-point-write-report.html
//
// สำคัญ: รันเสร็จแล้วต้อง cleanup DB เสมอ (ลบ recipe ที่ recipeName LIKE 'k6-load-%')
// เพราะเทสนี้สร้าง row จริงทุก request ที่ visibility='private' (ไม่หลุดไป public feed)
// รันเฉพาะ localhost/staging เท่านั้น ห้ามยิงใส่ production

import http from 'k6/http';
import { check, sleep } from 'k6';
import encoding from 'k6/encoding';

const BASE = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_EMAIL = __ENV.K6_AUTH_EMAIL || '';
const AUTH_PASSWORD = __ENV.K6_AUTH_PASSWORD || '';
const SUPABASE_URL = __ENV.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';

// ระดับ VUs ที่จะไล่ (ตั้งเพดานต่ำกว่า read เพราะเขียน DB หนักกว่ามาก)
// ถ้ารอบแรกพังไวมาก ลองลดเป็น [3,5,10,15,20,30,50] แทนได้
const LEVELS = [5, 10, 20, 30, 50, 75, 100, 150];

const stages = [];
for (const target of LEVELS) {
  stages.push({ duration: '5s', target });
  stages.push({ duration: '25s', target });
}
stages.push({ duration: '15s', target: 0 });

export const options = {
  scenarios: {
    breaking_point_write: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages,
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

// ---------- login ครั้งเดียว (setup) แล้วแจก session cookie ให้ทุก VU ----------
export function setup() {
  for (const v of [AUTH_EMAIL, AUTH_PASSWORD, SUPABASE_URL, SUPABASE_ANON_KEY]) {
    if (!v) {
      throw new Error(
        'Missing auth env. รันด้วย: k6 run -e K6_AUTH_EMAIL=... -e K6_AUTH_PASSWORD=... ' +
        '-e SUPABASE_URL=... -e SUPABASE_ANON_KEY=... k6/breaking-point-write.js'
      );
    }
  }
  http.get(`${BASE}/api/health`); // warmup เฉยๆ ไม่นับผล

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
  const ref = SUPABASE_URL.replace(/^https?:\/\//, '').split('.')[0];
  const cookieName = `sb-${ref}-auth-token`;
  const cookieValue = 'base64-' + encoding.b64encode(JSON.stringify(session), 'url');
  return { cookieName, cookieValue };
}

// ---------- payload ตรง Zod schema (createRecipeSchema) ----------
function buildPayload() {
  const uniq = `${__VU}-${__ITER}-${Date.now()}`;
  return JSON.stringify({
    recipeName: `k6-load-${uniq}`.slice(0, 100),
    description: 'k6 breaking-point test (auto-generated, safe to delete)'.slice(0, 200),
    instructions: 'Mix and cook.'.slice(0, 500),
    ingredients: [
      { name: 'k6 test egg', quantity: 2, unit: 'pcs' },
      { name: 'k6 test flour', quantity: 100, unit: 'g' },
    ],
    visibility: 'private',
  });
}

export default function (data) {
  const params = {
    headers: { 'Content-Type': 'application/json' },
    cookies: { [data.cookieName]: data.cookieValue },
    tags: { name: 'recipes-write', endpoint: 'recipes-write' },
  };
  const res = http.post(`${BASE}/api/recipes`, buildPayload(), params);
  check(res, { 'write status 201': (r) => r.status === 201 });
  sleep(1);
}
