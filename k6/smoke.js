import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: 1,
  duration: '30s',
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

export function setup() {
  for (const t of TARGETS) {
    http.get(t.url);
  }
}

export default function () {
  for (const t of TARGETS) {
    const res = http.get(t.url, { tags: { endpoint: t.name } });
    check(res, {
      [`${t.name} status 200`]: (r) => r.status === 200,
      [`${t.name} duration ok`]: (r) => r.timings.duration < 800,
    });
    sleep(0.5);
  }
}
