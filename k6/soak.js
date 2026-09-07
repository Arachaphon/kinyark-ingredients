import http from 'k6/http';
import { check, sleep } from 'k6';

// Soak 10 VUs — จับ memory leak / response time ไหลระยะยาว
// สเปกสไลด์ 30-60 นาที เวอร์ชันนี้ย่อเหลือ 10 นาทีสำหรับเวิร์กช็อป
// ขยายเวลา: k6 run --duration 30m k6/soak.js

const BASE = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: 10,
  duration: '10m',
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

const TARGETS = [
  { name: 'health', url: `${BASE}/api/health` },
  { name: 'ingredients', url: `${BASE}/api/ingredients` },
  { name: 'search', url: `${BASE}/api/search?q=${encodeURIComponent('ไข่')}` },
  { name: 'recipes', url: `${BASE}/api/recipes?page=1&limit=12` },
  { name: 'featured', url: `${BASE}/api/recipes/featured` },
];

export default function () {
  for (const t of TARGETS) {
    const res = http.get(t.url, { tags: { name: t.name, endpoint: t.name } });
    check(res, { [`${t.name} status 200`]: (r) => r.status === 200 });
    sleep(1);
  }
}
