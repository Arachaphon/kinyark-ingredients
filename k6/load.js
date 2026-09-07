import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 20 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

function getWeightedTarget() {
  const r = Math.random();
  if (r < 0.4) return { name: 'recipes', url: `${BASE}/api/recipes?page=1&limit=12` };
  if (r < 0.65) return { name: 'search', url: `${BASE}/api/search?q=${encodeURIComponent('ไข่')}` };
  if (r < 0.85) return { name: 'ingredients', url: `${BASE}/api/ingredients` };
  if (r < 0.95) return { name: 'featured', url: `${BASE}/api/recipes/featured` };
  return { name: 'health', url: `${BASE}/api/health` };
}

export function setup() {
  for (const u of [
    `${BASE}/api/health`,
    `${BASE}/api/ingredients`,
    `${BASE}/api/search?q=${encodeURIComponent('ไข่')}`,
    `${BASE}/api/recipes?page=1&limit=12`,
    `${BASE}/api/recipes/featured`,
  ]) {
    http.get(u);
  }
}

export default function () {
  const t = getWeightedTarget();
  const res = http.get(t.url, { tags: { name: t.name, endpoint: t.name } });
  check(res, {
    [`${t.name} status 200`]: (r) => r.status === 200,
    [`${t.name} response time OK`]: (r) => r.timings.duration < 800,
  });
  sleep(Math.random() * 2 + 1);
}
