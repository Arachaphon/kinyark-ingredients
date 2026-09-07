import http from 'k6/http';
import { check } from 'k6';

// Warm-up: hit every endpoint once so caches/pools are hot before a real run.
// Not a test — no thresholds. Run first, then run smoke/load:
//   k6 run k6/warmup.js -e BASE_URL=http://localhost:3000
//   k6 run k6/smoke.js -e BASE_URL=http://localhost:3000 --summary-export k6/smoke-summary.json

const BASE = __ENV.BASE_URL || 'http://localhost:3000';

const TARGETS = [
  `${BASE}/api/health`,
  `${BASE}/api/ingredients`,
  `${BASE}/api/search?q=${encodeURIComponent('ไข่')}`,
  `${BASE}/api/recipes?page=1&limit=12`,
  `${BASE}/api/recipes/featured`,
];

export const options = {
  vus: 1,
  iterations: TARGETS.length,
};

export default function () {
  const url = TARGETS[__ITER % TARGETS.length];
  const res = http.get(url);
  check(res, { 'warmup status 200': (r) => r.status === 200 });
}
