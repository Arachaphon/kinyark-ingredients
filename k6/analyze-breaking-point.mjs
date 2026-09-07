#!/usr/bin/env node
// k6/analyze-breaking-point.mjs
//
// วิเคราะห์ไฟล์ raw JSON จาก k6 (--out json=...) แล้วตอบ 2 อย่างที่โจทย์ต้องการ:
//   1. จำนวน VUs สูงสุดที่ระบบยังรองรับได้ (อยู่ในเกณฑ์ p95 < threshold และ error < 1%)
//   2. จำนวน VUs ที่เริ่มทำให้ประสิทธิภาพลดลง (breaking point)
//
// ใช้ได้กับไฟล์ raw JSON จากสคริปต์ k6 ตัวไหนก็ได้ (breaking-point-read.js,
// breaking-point-write.js, หรือแม้แต่ recipes-write-ramp.js/stress.js เดิม)
// เพราะอ่านจาก metric "vus" ที่ k6 ส่งออกมาเองอัตโนมัติทุกครั้ง ไม่ต้องแก้สคริปต์เทส
//
// วิธีใช้:
//   node analyze-breaking-point.mjs <raw.json> [out.html] [p95_threshold_ms]
//
// ตัวอย่าง:
//   node k6/analyze-breaking-point.mjs outputs/breaking-point-read-raw.json outputs/breaking-point-read-report.html 800

import fs from 'node:fs';
import path from 'node:path';

const [, , rawPathArg, outHtmlArg, thresholdArg] = process.argv;

if (!rawPathArg) {
  console.error('Usage: node analyze-breaking-point.mjs <raw.json> [out.html] [p95_threshold_ms]');
  process.exit(1);
}
if (!fs.existsSync(rawPathArg)) {
  console.error(`ไม่พบไฟล์: ${rawPathArg}`);
  process.exit(1);
}

const outHtml = outHtmlArg || rawPathArg.replace(/\.json$/, '-report.html');
const P95_THRESHOLD = Number(thresholdArg || 800); // ms

// ---------- 1. อ่าน NDJSON (ไฟล์อาจใหญ่หลักสิบ-ร้อย MB) ----------
console.log(`กำลังอ่านไฟล์: ${rawPathArg} ...`);
const raw = fs.readFileSync(rawPathArg, 'utf8');
const lines = raw.split('\n').filter(Boolean);
console.log(`พบทั้งหมด ${lines.length} events`);

const vusPoints = [];
const durationPoints = [];
const failedPoints = [];

for (const line of lines) {
  let obj;
  try {
    obj = JSON.parse(line);
  } catch {
    continue;
  }
  if (obj.type !== 'Point' || !obj.data) continue;
  const t = new Date(obj.data.time).getTime();
  const v = obj.data.value;
  if (obj.metric === 'vus') vusPoints.push({ t, v });
  else if (obj.metric === 'http_req_duration') durationPoints.push({ t, v });
  else if (obj.metric === 'http_req_failed') failedPoints.push({ t, v });
}

if (vusPoints.length === 0) {
  console.error(
    'ไม่พบ metric "vus" ในไฟล์นี้ — ต้องรัน k6 ด้วย --out json=... (ไม่ใช่แค่ --summary-export)'
  );
  process.exit(1);
}
if (durationPoints.length === 0) {
  console.error('ไม่พบ metric "http_req_duration" — ไฟล์นี้อาจไม่ใช่ raw JSON ของ k6 ที่ถูกต้อง');
  process.exit(1);
}

vusPoints.sort((a, b) => a.t - b.t);

// ---------- 2. หาว่า ณ เวลา t มี VU เท่าไหร่ (binary search หาค่า vus ล่าสุดก่อนเวลานั้น) ----------
function vusAt(t) {
  let lo = 0,
    hi = vusPoints.length - 1,
    ans = vusPoints[0].v;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (vusPoints[mid].t <= t) {
      ans = vusPoints[mid].v;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

// ---------- 3. หาระดับ VUs ที่ "นิ่ง" จริง (ตัดช่วง ramp สั้นๆ ทิ้ง) ----------
// นับว่าค่า vus ไหนปรากฏบ่อย (>=3 ครั้ง) ถือว่าเป็นระดับที่ระบบ hold อยู่จริง
const vusHistogram = new Map();
for (const p of vusPoints) {
  vusHistogram.set(p.v, (vusHistogram.get(p.v) || 0) + 1);
}
const stableLevels = [...vusHistogram.entries()]
  .filter(([v, count]) => v > 0 && count >= 3)
  .map(([v]) => v)
  .sort((a, b) => a - b);

if (stableLevels.length === 0) {
  console.error(
    'ไม่พบระดับ VUs ที่ "นิ่ง" พอจะวิเคราะห์ได้ — สคริปต์เทสอาจ ramp ต่อเนื่องไม่มีช่วง hold ' +
      '(แนะนำใช้ breaking-point-read.js / breaking-point-write.js ที่มี ramp+hold ชัดเจน)'
  );
  process.exit(1);
}

function nearestLevel(v) {
  let best = stableLevels[0],
    bestDiff = Infinity;
  for (const lvl of stableLevels) {
    const diff = Math.abs(lvl - v);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = lvl;
    }
  }
  return best;
}

// ---------- 4. รวมข้อมูล request ตามระดับ VUs ----------
const buckets = new Map();
for (const p of durationPoints) {
  const lvl = nearestLevel(vusAt(p.t));
  if (!buckets.has(lvl)) buckets.set(lvl, { durations: [], failed: 0, total: 0 });
  const b = buckets.get(lvl);
  b.durations.push(p.v);
  b.total += 1;
}
for (const p of failedPoints) {
  const lvl = nearestLevel(vusAt(p.t));
  const b = buckets.get(lvl);
  if (b && p.v === 1) b.failed += 1;
}

function percentile(arr, p) {
  const s = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * s.length) - 1;
  return s[Math.max(0, Math.min(s.length - 1, idx))];
}

const rows = [...buckets.entries()]
  .filter(([lvl]) => lvl > 0)
  .sort((a, b) => a[0] - b[0])
  .map(([lvl, b]) => {
    const avg = b.durations.reduce((s, x) => s + x, 0) / b.durations.length;
    return {
      vus: lvl,
      requests: b.total,
      avg_ms: +avg.toFixed(1),
      p90_ms: +percentile(b.durations, 90).toFixed(1),
      p95_ms: +percentile(b.durations, 95).toFixed(1),
      p99_ms: +percentile(b.durations, 99).toFixed(1),
      error_rate: +((b.failed / b.total) * 100).toFixed(2),
    };
  });

// ---------- 5. หา breaking point ----------
// เกณฑ์ "เริ่มตก": p95 เกิน threshold หรือ error rate > 1% เป็นครั้งแรก (VUs ต่ำสุดที่ผิดเกณฑ์)
let breakingPoint = null;
let maxSupported = null;
for (const r of rows) {
  const degraded = r.p95_ms > P95_THRESHOLD || r.error_rate > 1;
  if (!degraded) maxSupported = r.vus;
  if (degraded && breakingPoint === null) breakingPoint = r.vus;
}

const summaryText = breakingPoint
  ? `ระบบรองรับผู้ใช้งานพร้อมกันได้สูงสุดประมาณ ${maxSupported ?? 'N/A'} VUs ` +
    `และเริ่มมีประสิทธิภาพลดลง (p95 > ${P95_THRESHOLD}ms หรือ error rate > 1%) เมื่อผู้ใช้งานพร้อมกันถึง ${breakingPoint} VUs`
  : `ระบบผ่านเกณฑ์ (p95 < ${P95_THRESHOLD}ms, error < 1%) ตลอดช่วงที่ทดสอบ (สูงสุด ${
      rows.at(-1)?.vus ?? 'N/A'
    } VUs) — ถ้าต้องการหา breaking point จริง ให้เพิ่มระดับ VUs สูงสุดในสคริปต์เทสแล้วรันใหม่`;

console.log('\n=== ผลวิเคราะห์ต่อระดับ VUs ===');
console.table(rows);
console.log('\n' + summaryText + '\n');

// ---------- 6. สร้าง HTML report พร้อมกราฟ (Chart.js) ----------
const html = `<!DOCTYPE html>
<html lang="th"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>k6 Breaking Point Report</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>
body{font-family:system-ui,sans-serif;background:#f4f6f8;margin:0;padding:24px;color:#222}
h1{margin:0 0 4px}.sub{color:#666;margin-bottom:16px;font-size:14px}
.card{background:#fff;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.highlight{background:#fff8e1;border-left:6px solid #f5a623;padding:14px 18px;border-radius:8px;font-size:16px;margin-bottom:16px;line-height:1.6}
table{width:100%;border-collapse:collapse;margin-top:8px;font-size:14px}
th,td{border-bottom:1px solid #eee;padding:6px 8px;text-align:right}
th:first-child,td:first-child{text-align:left}
tr.bad td{background:#fdecea;color:#a11}
tr.good td{background:#eafaf0}
</style></head><body>
<h1>k6 Breaking Point Report</h1>
<div class="sub">สร้างเมื่อ ${new Date().toLocaleString('th-TH')} · ไฟล์ต้นทาง: ${path.basename(
  rawPathArg
)} · เกณฑ์ p95 &lt; ${P95_THRESHOLD}ms, error &lt; 1%</div>

<div class="highlight"><strong>สรุปผล:</strong><br>${summaryText}</div>

<section class="card"><h2>VUs vs Response Time</h2><canvas id="chart" height="100"></canvas></section>

<section class="card"><h2>ตารางสรุปต่อระดับ VUs</h2>
<table><thead><tr><th>VUs</th><th>Requests</th><th>Avg (ms)</th><th>p90 (ms)</th><th>p95 (ms)</th><th>p99 (ms)</th><th>Error %</th></tr></thead>
<tbody>
${rows
  .map(
    (r) => `<tr class="${r.p95_ms > P95_THRESHOLD || r.error_rate > 1 ? 'bad' : 'good'}">
  <td>${r.vus}</td><td>${r.requests}</td><td>${r.avg_ms}</td><td>${r.p90_ms}</td><td>${r.p95_ms}</td><td>${r.p99_ms}</td><td>${r.error_rate}%</td>
</tr>`
  )
  .join('\n')}
</tbody></table>
</section>

<script>
const rows = ${JSON.stringify(rows)};
new Chart(document.getElementById('chart'), {
  type: 'line',
  data: {
    labels: rows.map(r => r.vus),
    datasets: [
      { label: 'avg (ms)', data: rows.map(r => r.avg_ms), borderColor: '#4c9aff', tension: 0.2 },
      { label: 'p95 (ms)', data: rows.map(r => r.p95_ms), borderColor: '#e05353', tension: 0.2 },
      { label: 'p99 (ms)', data: rows.map(r => r.p99_ms), borderColor: '#f5a623', tension: 0.2, borderDash: [5,5] },
      { label: 'threshold (${P95_THRESHOLD}ms)', data: rows.map(() => ${P95_THRESHOLD}), borderColor: '#999', borderDash: [2,2], pointRadius: 0 },
    ]
  },
  options: {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { title: { display: true, text: 'Virtual Users (VUs)' } },
      y: { title: { display: true, text: 'Response time (ms)' }, beginAtZero: true },
    }
  }
});
</script>
</body></html>`;

fs.mkdirSync(path.dirname(outHtml), { recursive: true });
fs.writeFileSync(outHtml, html, 'utf8');
console.log(`บันทึกรายงาน (มีกราฟ) ที่: ${outHtml}`);
console.log('เปิดไฟล์นี้ด้วยเบราว์เซอร์เพื่อดูกราฟ + ตารางสรุป');
