import http from 'k6/http';
import { check, sleep } from 'k6';

// Spike 0 -> 150 VUs / 3 min — กระชากโหลดดูว่าระบบล้มแล้วฟื้นหรือไม่
// รันเฉพาะ localhost/staging เท่านั้น

const BASE = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '30s', target: 0 },
    { duration: '30s', target: 150 },
    { duration: '1m', target: 150 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.1'],
    checks: ['rate>0.9'],
  },
};

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
