import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

const BASE = __ENV.BASE_URL || 'http://localhost:3000';

// แหล่งเดียวของแผน stages: แก้ตรงนี้ที่เดียว ทั้ง options,
// bucket รายงานใน handleSummary และสคริปต์ analyze (--durations) ตามเอง
const PLAN = [
  { dur: '10s', sec: 10, vus: 1 },
  { dur: '10s', sec: 10, vus: 50 },
  { dur: '10s', sec: 15, vus: 100 },
  { dur: '10s', sec: 20, vus: 150 },
  { dur: '10s', sec: 30, vus: 200 },
  { dur: '10s', sec: 30, vus: 30 },
  { dur: '10s', sec: 30, vus: 400 },
  { dur: '10s', sec: 30, vus: 500 },
  { dur: '10s', sec: 30, vus: 600 },
  { dur: '10s', sec: 30, vus: 700 },
  { dur: '10s', sec: 30, vus: 800 },
  { dur: '10s', sec: 30, vus: 900 },
  { dur: '10s', sec: 30, vus: 1000 },
  { dur: '10s', sec: 30, vus: 1100 },
  { dur: '10s', sec: 30, vus: 0 },
];
// ขอบเขตช่วงเวลา (วินาที) ต่อ stage: [start, end)
const BOUNDS = [];
{
  let acc = 0;
  for (const p of PLAN) {
    BOUNDS.push({ from: acc, to: acc + p.sec, vus: p.vus });
    acc += p.sec;
  }
}

export const options = {
  stages: PLAN.map((p) => ({ duration: p.dur, target: p.vus })),
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
  { name: 'search-ingredients-kai', url: `${BASE}/api/search?ingredients=${encodeURIComponent('ไก่')}` },
  { name: 'recipes', url: `${BASE}/api/recipes?page=1&limit=12` },
  { name: 'featured', url: `${BASE}/api/recipes/featured` },
];

// Metrics รายเซลล์ (API x stage): Trend เก็บ latency, Counter นับ reqs/slow>800ms
// (k6 ไม่แยก submetric ตาม tag/เวลาให้ เลยต้องแยก metric ชัดเจน)
const cellKey = (ep, si) => `${ep}__s${si}`;
const cellMetric = (ep, si) => `c_${ep.replace(/-/g, '_')}_s${si}`;
const cellTrend = {};
const cellReq = {};
const cellSlow = {};
for (const t of TARGETS) {
  for (let i = 0; i < PLAN.length; i += 1) {
    const m = cellMetric(t.name, i);
    cellTrend[cellKey(t.name, i)] = new Trend(m);
    cellReq[cellKey(t.name, i)] = new Counter(`${m}_n`);
    cellSlow[cellKey(t.name, i)] = new Counter(`${m}_slow`);
  }
}

function stageOf(elapsedSec) {
  for (let i = 0; i < BOUNDS.length; i += 1) {
    if (elapsedSec < BOUNDS[i].to) return i;
  }
  return BOUNDS.length - 1;
}

export function setup() {
  for (const t of TARGETS) {
    http.get(t.url);
  }
  return { t0: Date.now() };
}

export default function (data) {
  const elapsed = (Date.now() - (data && data.t0)) / 1000;
  const si = stageOf(elapsed);
  for (const t of TARGETS) {
    const res = http.get(t.url, { tags: { endpoint: t.name } });
    const d = res.timings.duration;
    const k = cellKey(t.name, si);
    cellTrend[k].add(d);
    cellReq[k].add(1);
    if (d > 800) cellSlow[k].add(1);
    check(res, {
      [`${t.name} status 200`]: (r) => r.status === 200,
      [`${t.name} duration <800ms`]: (r) => r.timings.duration < 800,
    });
    sleep(0.5);
  }
}

// ---------- วาดตาราง console (กรอบกล่อง + จัดคอลัมน์) ----------
function mv(metric, key) {
  return ((metric && (metric.values || metric)) || {})[key];
}

function drawTable(headers, rows) {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => String(r[i]).length))
  );
  const line = (l, m, r) =>
    l + widths.map((w) => '─'.repeat(w + 2)).join(m) + r;
  const row = (cells) =>
    '│ ' + cells.map((c, i) => String(c).padEnd(widths[i])).join(' │ ') + ' │';
  return [
    line('┌', '┬', '┐'),
    row(headers),
    line('├', '┼', '┤'),
    ...rows.map(row),
    line('└', '┴', '┘'),
  ];
}

function verdictOf(p95) {
  if (!Number.isFinite(p95)) return '-';
  return p95 > 800 ? 'SLOW x' : 'OK';
}

export function handleSummary(data) {
  const out = [];
  const f1 = (n) => (Number.isFinite(n) ? n.toFixed(1) : '-');

  // อ่านค่าทุกเซลล์
  const cell = {};
  for (const t of TARGETS) {
    for (let i = 0; i < PLAN.length; i += 1) {
      const m = cellMetric(t.name, i);
      const tv = (data.metrics[m] && data.metrics[m].values) || {};
      const reqs = mv(data.metrics[`${m}_n`], 'count') || 0;
      const slows = mv(data.metrics[`${m}_slow`], 'count') || 0;
      cell[cellKey(t.name, i)] = {
        reqs,
        avg: tv.avg,
        p95: tv['p(95)'],
        max: tv.max,
        slows,
        slowPct: reqs ? (slows / reqs) * 100 : 0,
      };
    }
  }

  // ตารางที่ 0 — ภาพรวมทั้งรัน
  const hd = (data.metrics.http_req_duration && data.metrics.http_req_duration.values) || {};
  const totCount = mv(data.metrics.http_reqs, 'count') || 0;
  const failRate = mv(data.metrics.http_req_failed, 'value') ?? mv(data.metrics.http_req_failed, 'rate') ?? 0;
  const checksRate = (mv(data.metrics.checks, 'value') ?? 1) * 100;
  const overallVerdict = checksRate > 99 && (hd['p(95)'] || 0) <= 800 ? 'PASS' : 'FAIL';
  out.push('', '== ภาพรวมทั้งรัน ==');
  out.push(...drawTable(
    ['requests', 'avg', 'p95', 'max', 'failed', 'checks', 'verdict'],
    [[totCount, `${f1(hd.avg)}ms`, `${f1(hd['p(95)'])}ms`, `${f1(hd.max)}ms`,
      `${(failRate * 100).toFixed(2)}%`, `${checksRate.toFixed(2)}%`, overallVerdict]]
  ));
  out.push('เกณฑ์: p95<800 / failed<1% / checks>99%');

  // ตารางที่ 1-6 — รายช่วงเวลา (ทุก API ในช่วงนั้น)
  const apiRow = (ep, c) => [
    ep, c.reqs, c.reqs ? `${f1(c.avg)}ms` : '-',
    c.reqs ? `${f1(c.p95)}ms` : '-',
    c.reqs ? `${f1(c.max)}ms` : '-',
    c.reqs ? `${c.slows} (${f1(c.slowPct)}%)` : '-',
    c.reqs ? verdictOf(c.p95) : '-',
  ];
  for (let i = 0; i < PLAN.length; i += 1) {
    const b = BOUNDS[i];
    out.push('', `== ช่วง ${b.from}-${b.to}s (${b.vus} VUs) : ทุก API ==`);
    out.push(...drawTable(
      ['API', 'reqs', 'avg', 'p95', 'max', 'slow>800', 'verdict'],
      TARGETS.map((t) => apiRow(t.name, cell[cellKey(t.name, i)]))
    ));
  }

  // ตารางราย API ตามเวลา (ทุกช่วงของ API นั้น)
  for (const t of TARGETS) {
    out.push('', `== API: ${t.name} ตามเวลา ==`);
    out.push(...drawTable(
      ['window', 'VUs', 'reqs', 'avg', 'p95', 'slow>800', 'verdict'],
      BOUNDS.map((b, i) => {
        const c = cell[cellKey(t.name, i)];
        return [
          `${b.from}-${b.to}s`, b.vus, c.reqs,
          c.reqs ? `${f1(c.avg)}ms` : '-',
          c.reqs ? `${f1(c.p95)}ms` : '-',
          c.reqs ? `${c.slows} (${f1(c.slowPct)}%)` : '-',
          c.reqs ? verdictOf(c.p95) : '-',
        ];
      })
    ));
  }

  // ตารางสรุป — API ไหนเริ่มช้าตรงไหน (slow>0% ครั้งแรก)
  out.push('', '== เริ่มช้าครั้งแรกของแต่ละ API (slow>800ms) ==');
  out.push(...drawTable(
    ['API', 'stage แรกที่ช้า', 'slow%', 'p95'],
    TARGETS.map((t) => {
      for (let i = 0; i < PLAN.length; i += 1) {
        const c = cell[cellKey(t.name, i)];
        if (c.reqs && c.slows > 0) {
          return [t.name, `stage ${i + 1} (${BOUNDS[i].vus} VUs)`,
            `${f1(c.slowPct)}%`, `${f1(c.p95)}ms`];
        }
      }
      return [t.name, 'ไม่ช้าเลย', '-', '-'];
    })
  ));

  return {
    stdout: out.join('\n') + '\n',
    'tests/k6/report-k6reporter.html': htmlReport(data),
  };
}
