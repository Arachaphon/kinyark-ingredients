import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const outPath = join(dir, process.argv[2] || 'report.html');

const EXPECTED = {
  smoke: [
    { metric: 'http_req_duration', kind: 'p95max', value: 800, label: 'p95 < 800ms' },
    { metric: 'http_req_failed', kind: 'ratemax', value: 0.01, label: 'failed < 1%' },
    { metric: 'checks', kind: 'ratemin', value: 0.99, label: 'checks > 99%' },
  ],
  load: [
    { metric: 'http_req_duration', kind: 'p95max', value: 800, label: 'p95 < 800ms' },
    { metric: 'http_req_failed', kind: 'ratemax', value: 0.01, label: 'failed < 1%' },
    { metric: 'checks', kind: 'ratemin', value: 0.99, label: 'checks > 99%' },
  ],
  stress: [
    { metric: 'http_req_failed', kind: 'ratemax', value: 0.05, label: 'failed < 5%' },
    { metric: 'checks', kind: 'ratemin', value: 0.95, label: 'checks > 95%' },
  ],
};

function num(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function ms(v) {
  const n = num(v);
  return n >= 1000 ? `${(n / 1000).toFixed(2)} s` : `${n.toFixed(1)} ms`;
}

function pct(v) {
  return `${(num(v) * 100).toFixed(2)}%`;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function metricValues(summary, name) {
  const metrics = (summary && summary.metrics) || {};
  if (metrics[name] && typeof metrics[name] === 'object') {
    if (metrics[name].values && typeof metrics[name].values === 'object') return metrics[name].values;
    return metrics[name];
  }
  const sub = Object.keys(metrics).find((k) => k === name || k.startsWith(`${name}{`));
  const hit = sub ? metrics[sub] : null;
  if (hit && typeof hit === 'object') return hit.values && typeof hit.values === 'object' ? hit.values : hit;
  return {};
}

function evalRule(summary, rule) {
  const v = metricValues(summary, rule.metric);
  if (rule.kind === 'p95max') {
    const p95 = num(v['p(95)'], NaN);
    return { pass: p95 <= rule.value, actual: ms(p95) };
  }
  if (rule.kind === 'ratemax') {
    const rate = num(v.rate ?? v.value, NaN);
    return { pass: rate <= rule.value, actual: pct(rate) };
  }
  const rate = num(v.rate ?? v.value, NaN);
  return { pass: rate >= rule.value, actual: pct(rate) };
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function checksByEndpoint(rootChecks) {
  const groups = new Map();
  const entries = Object.values(rootChecks || {});
  for (const c of entries) {
    const name = String((c && c.name) || '');
    if (!name) continue;
    const ep = name.split(' ')[0].toLowerCase();
    if (!groups.has(ep)) groups.set(ep, []);
    const passes = num(c.passes);
    const fails = num(c.fails);
    const total = passes + fails;
    groups.get(ep).push({ name, passes, fails, rate: total ? passes / total : 0 });
  }
  return [...groups.entries()]
    .map(([endpoint, checks]) => ({ endpoint, checks: checks.sort((a, b) => a.rate - b.rate) }))
    .sort((a, b) => a.endpoint.localeCompare(b.endpoint));
}

function loadRuns() {
  return readdirSync(dir)
    .filter((f) => f.endsWith('-summary.json'))
    .map((f) => {
      const name = basename(f, '-summary.json');
      const summary = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      const rules = EXPECTED[name] || EXPECTED.load;
      const results = rules.map((r) => ({ ...r, ...evalRule(summary, r) }));
      const dur = metricValues(summary, 'http_req_duration');
      const failed = metricValues(summary, 'http_req_failed');
      const checks = metricValues(summary, 'checks');
      const reqs = metricValues(summary, 'http_reqs');
      const checkGroups = checksByEndpoint(summary.root_group && summary.root_group.checks);
      return {
        name,
        file: f,
        pass: results.every((r) => r.pass),
        results,
        avg: num(dur.avg),
        p95: num(dur['p(95)']),
        max: num(dur.max),
        failedRate: num(failed.rate ?? failed.value),
        checksRate: num(checks.rate ?? checks.value),
        reqCount: Math.round(num(reqs.count)),
        checkGroups,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildHtml(runs) {
  const generated = new Date().toLocaleString('th-TH');
  const cards = runs.map((r) => {
    const badges = r.results.map((t) =>
      `<span class="badge ${t.pass ? 'ok' : 'bad'}">${t.pass ? '✓' : '✗'} ${esc(t.label)} (${esc(t.actual)})</span>`
    ).join('');
    const checkTable = r.checkGroups.length ? `
      <h4>ราย check (จาก summary.json)</h4>
      ${r.checkGroups.map((g) => `
      <h5>${esc(g.endpoint)}</h5>
      <table><thead><tr><th>check</th><th>passes</th><th>fails</th><th>rate</th></tr></thead>
      <tbody>${g.checks.map((c) =>
        `<tr><td>${esc(c.name)}</td><td>${c.passes}</td><td>${c.fails}</td><td>${pct(c.rate)}</td></tr>`
      ).join('')}</tbody></table>`).join('')}` : '';
    return `
    <section class="card ${r.pass ? '' : 'fail'}">
      <h2>${esc(r.name)} <span class="badge ${r.pass ? 'ok' : 'bad'}">${r.pass ? 'PASS' : 'FAIL'}</span></h2>
      <div class="badges">${badges}</div>
      <div class="grid">
        <div><b>${r.reqCount}</b><span>requests</span></div>
        <div><b>${ms(r.avg)}</b><span>avg</span></div>
        <div><b>${ms(r.p95)}</b><span>p95</span></div>
        <div><b>${ms(r.max)}</b><span>max</span></div>
        <div><b>${pct(r.failedRate)}</b><span>failed</span></div>
        <div><b>${pct(r.checksRate)}</b><span>checks</span></div>
      </div>
      ${checkTable}
    </section>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="th"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>k6 Load Report — Kinyark</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>
body{font-family:system-ui,sans-serif;background:#f4f6f8;margin:0;padding:24px;color:#222}
h1{margin:0 0 4px}.sub{color:#666;margin-bottom:16px}
.card{background:#fff;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.card.fail{border-left:6px solid #e05353}
.badges{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 12px}
.badge{padding:4px 10px;border-radius:999px;font-size:13px;background:#eee}
.badge.ok{background:#dff5e1;color:#1c7a2e}.badge.bad{background:#fbdcdc;color:#a11}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px}
.grid div{background:#f7f9fb;border-radius:8px;padding:10px;text-align:center}
.grid b{display:block;font-size:18px}.grid span{font-size:12px;color:#666}
table{width:100%;border-collapse:collapse;margin-top:8px;font-size:14px}
th,td{border-bottom:1px solid #eee;padding:6px 8px;text-align:right}
th:first-child,td:first-child{text-align:left}
code{background:#eef;padding:2px 6px;border-radius:4px}
</style></head><body>
<h1>k6 Load Report — Kinyark Ingredients</h1>
<div class="sub">สร้างเมื่อ ${esc(generated)} · เกณฑ์ p95&lt;800ms / failed&lt;1% / checks&gt;99%</div>
<section class="card"><h2>เทียบ p95/avg/max ระหว่างรัน (ms)</h2><canvas id="runChart"></canvas></section>
${cards}
<section class="card"><h2>วิธีรันเก็บผล</h2>
<pre><code>k6 run k6/smoke.js -e BASE_URL=http://localhost:3000 --summary-export k6/smoke-summary.json
k6 run k6/load.js -e BASE_URL=http://localhost:3000 --summary-export k6/load-summary.json
k6 run k6/stress.js -e BASE_URL=http://localhost:3000 --summary-export k6/stress-summary.json
node k6/report.mjs</code></pre>
<p>ตารางราย check มาจาก <code>root_group.checks</code> ในไฟล์ summary อยู่แล้ว ไม่ต้องรัน k6 เพิ่ม</p></section>
<script>
const runs=${JSON.stringify(runs.map((r) => ({ name: r.name, avg: +r.avg.toFixed(1), p95: +r.p95.toFixed(1), max: +r.max.toFixed(1) })))};
new Chart(document.getElementById('runChart'),{type:'bar',
data:{labels:runs.map(r=>r.name),datasets:[
{label:'avg',data:runs.map(r=>r.avg)},{label:'p95',data:runs.map(r=>r.p95)},{label:'max',data:runs.map(r=>r.max)}]},
options:{responsive:true,scales:{y:{title:{display:true,text:'ms'}}}}});
</script></body></html>`;
}

const runs = loadRuns();
if (!runs.length) {
  console.error('ไม่พบไฟล์ *-summary.json ใน k6/ — รัน k6 พร้อม --summary-export ก่อน');
  process.exit(1);
}
writeFileSync(outPath, buildHtml(runs), 'utf8');
console.log(`เขียน ${outPath} จาก ${runs.length} รัน: ${runs.map((r) => `${r.name}=${r.pass ? 'PASS' : 'FAIL'}`).join(', ')}`);
