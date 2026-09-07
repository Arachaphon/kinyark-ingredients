import http from 'k6/http';
import { check } from 'k6';

// Breaking Point — ดัน VUs ขึ้นเรื่อย ๆ จน error เกิน 30% แล้วหยุดเอง
// รันเฉพาะ localhost/staging เท่านั้น ห้ามยิงเว็บจริง
// k6 run -e MAX_VUS=500 -e BASE_URL=http://localhost:3000 k6/breaking-point.js

const BASE = __ENV.BASE_URL || 'http://localhost:3000';
const MAX_VUS = Number(__ENV.MAX_VUS) || 300;

export const options = {
  scenarios: {
    breaking_point: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: Math.round(MAX_VUS * 0.2) },
        { duration: '2m', target: Math.round(MAX_VUS * 0.5) },
        { duration: '2m', target: Math.round(MAX_VUS * 0.8) },
        { duration: '2m', target: MAX_VUS },
        { duration: '2m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.3', abortOnFail: true }],
  },
};

export default function () {
  const res = http.get(`${BASE}/api/health`);
  check(res, { 'status is 200': (r) => r.status === 200 });
}
