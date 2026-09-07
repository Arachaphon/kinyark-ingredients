import http from 'k6/http';
import { check, sleep } from 'k6';

// Stress 20 -> 150 VUs / 8 min — หาแนวโน้มก่อนถึง breaking point
// รันเฉพาะ localhost/staging เท่านั้น

const BASE = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '2m', target: 20 },
    { duration: '2m', target: 80 },
    { duration: '2m', target: 150 },
    { duration: '1m', target: 150 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    checks: ['rate>0.95'],
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
  check(res, { [`${t.name} no 5xx`]: (r) => r.status < 500 });
  sleep(0.5);
}
