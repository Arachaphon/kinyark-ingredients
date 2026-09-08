// tests/k6/lib/detailed-report.js
// ตัวสร้างรายงาน HTML แบบละเอียด (ตารางแบบ report.html) จากข้อมูล handleSummary.
// ใช้ร่วมกันได้หลายไฟล์เทส: ผู้เรียกส่ง cells (ราย API x stage) + ภาพรวม + config มาให้.
//
// รูปแบบ cells: { [cellKey]: { reqs, avg, p95, max, fails, failPct } }
// stages: [{ label, vus, note }]  |  apis: [endpointName...]
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function f1(n) {
  return Number.isFinite(n) ? n.toFixed(1) : '-';
}

function verdictCell(fails, reqs) {
  if (!reqs) return '<td>-</td>';
  return fails > 0 ? '<td class="bad">FAIL</td>' : '<td class="good">OK</td>';
}

export function buildDetailedHtml(o) {
  const { title, sub, generated, overall, stages, apis, cells, firstFailed, checks, config, rerun } = o;

  const stageTables = stages.map((st, i) => `
<section class="card">
  <h2>ช่วง ${esc(st.label)} (${st.vus} VUs) — ทุก API</h2>
  <table><thead><tr><th>API</th><th>reqs</th><th>avg</th><th>p95</th><th>max</th><th>failed</th><th>verdict</th></tr></thead>
  <tbody>${apis.map((ep) => {
    const c = cells[`${ep}__s${i}`] || { reqs: 0 };
    if (!c.reqs) return `<tr><td>${esc(ep)}</td><td colspan="5">ไม่มีข้อมูล (abort ก่อนถึง / ยังไม่รัน)</td><td>-</td></tr>`;
    const bad = c.fails > 0;
    return `<tr${bad ? ' class="badrow"' : ''}><td>${esc(ep)}</td><td>${c.reqs}</td><td>${f1(c.avg)}ms</td><td>${f1(c.p95)}ms</td><td>${f1(c.max)}ms</td><td>${c.fails} (${f1(c.failPct)}%)</td>${verdictCell(c.fails, c.reqs)}</tr>`;
  }).join('')}</tbody></table>
  ${st.note ? `<p class="note">${esc(st.note)}</p>` : ''}
</section>`).join('');

  const apiTables = apis.map((ep) => `
<details><summary>API: ${esc(ep)}</summary>
<table><thead><tr><th>window</th><th>VUs</th><th>reqs</th><th>avg</th><th>p95</th><th>failed</th><th>verdict</th></tr></thead>
<tbody>${stages.map((st, i) => {
    const c = cells[`${ep}__s${i}`] || { reqs: 0 };
    if (!c.reqs) return `<tr><td>${esc(st.label)}</td><td>${st.vus}</td><td colspan="4">ไม่มีข้อมูล</td><td>-</td></tr>`;
    const bad = c.fails > 0;
    return `<tr${bad ? ' class="badrow"' : ''}><td>${esc(st.label)}</td><td>${st.vus}</td><td>${c.reqs}</td><td>${f1(c.avg)}ms</td><td>${f1(c.p95)}ms</td><td>${c.fails} (${f1(c.failPct)}%)</td>${verdictCell(c.fails, c.reqs)}</tr>`;
  }).join('')}</tbody></table>
</details>`).join('');

  const matrix = `
<section class="card">
  <h2>failed% ราย API × ราย stage — แดง = มี failed</h2>
  <table><thead><tr><th>API</th>${stages.map((s) => `<th>${esc(s.vus)} VUs</th>`).join('')}</tr></thead>
  <tbody>${apis.map((ep) => `<tr><td>${esc(ep)}</td>${stages.map((_, i) => {
    const c = cells[`${ep}__s${i}`] || { reqs: 0 };
    if (!c.reqs) return '<td class="na">—</td>';
    return c.fails > 0 ? `<td class="bad">${f1(c.failPct)}%</td>` : '<td class="good">0%</td>';
  }).join('')}</tr>`).join('')}</tbody></table>
</section>`;

  const failedPerStage = stages.map((_, i) => {
    let reqs = 0, fails = 0;
    for (const ep of apis) {
      const c = cells[`${ep}__s${i}`] || { reqs: 0, fails: 0 };
      reqs += c.reqs; fails += c.fails;
    }
    return { reqs, fails, pct: reqs ? (fails / reqs) * 100 : 0 };
  });

  return `<!DOCTYPE html>
<html lang="th"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>
body{font-family:system-ui,sans-serif;background:#f4f6f8;margin:0;padding:24px;color:#222}
h1{margin:0 0 4px}.sub{color:#666;margin-bottom:16px}
.card{background:#fff;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.card.fail{border-left:6px solid #e05353}
.highlight-red{background:#fdecea;border-left:6px solid #e05353;padding:14px 18px;border-radius:8px;font-size:15px;margin-bottom:16px;line-height:1.7}
.highlight-green{background:#eafaf0;border-left:6px solid #2f9e44;padding:14px 18px;border-radius:8px;font-size:15px;margin-bottom:16px;line-height:1.7}
.badges{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 12px}
.badge{padding:4px 10px;border-radius:999px;font-size:13px;background:#eee}
.badge.ok{background:#dff5e1;color:#1c7a2e}.badge.bad{background:#fbdcdc;color:#a11}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px}
.grid div{background:#f7f9fb;border-radius:8px;padding:10px;text-align:center}
.grid b{display:block;font-size:18px}.grid span{font-size:12px;color:#666}
table{width:100%;border-collapse:collapse;margin-top:8px;font-size:14px}
th,td{border:1px solid #e5e7eb;padding:6px 8px;text-align:right}
th:first-child,td:first-child{text-align:left}
thead th{background:#f1f5f9}
tr.badrow td{background:#fdecea;color:#a11}
td.bad{background:#fdecea;color:#a11;font-weight:bold}
td.good{background:#eafaf0}
td.na{background:#f1f5f9;color:#999}
.note{color:#666;font-size:13px}
details{margin-top:10px;border:1px solid #e5e7eb;border-radius:8px;padding:8px 12px;background:#fbfdff}
summary{cursor:pointer;font-weight:bold}
code{background:#eef;padding:2px 6px;border-radius:4px}
pre{background:#0f172a;color:#e2e8f0;padding:12px;border-radius:8px;overflow:auto;font-size:13px}
pre code{background:none;padding:0}
</style></head><body>
<h1>${esc(title)}</h1>
<div class="sub">${esc(sub)} · สร้างอัตโนมัติท้ายรันเมื่อ ${esc(generated)}</div>

<section class="card${overall.pass ? '' : ' fail'}">
  <h2>สรุปผลรวม <span class="badge ${overall.pass ? 'ok' : 'bad'}">${overall.pass ? 'PASS' : 'FAIL'}</span></h2>
  <div class="badges">${overall.badges}</div>
  <div class="grid">${overall.stats}</div>
  <p class="note">ที่มา: summary อัตโนมัติจาก handleSummary (ไม่ต้องรัน analyzer)</p>
</section>

<div class="highlight-green"><strong>ฝั่งที่ไม่พัง:</strong><br>${o.greenBox}</div>
<div class="highlight-red"><strong>ฝั่งที่พัง:</strong><br>${o.redBox}</div>

<section class="card"><h2>failed% รวมราย stage</h2><canvas id="failChart" height="100"></canvas></section>

${stageTables}

<section class="card"><h2>ตารางละเอียดราย API ตามเวลา (กางดูได้)</h2>${apiTables}</section>

${matrix}

<section class="card">
  <h2>เริ่ม fail ครั้งแรกของแต่ละ API (status != 200)</h2>
  <table><thead><tr><th>API</th><th>stage แรกที่ fail</th><th>failed</th></tr></thead>
  <tbody>${apis.map((ep) => {
    const ff = firstFailed[ep];
    if (!ff) return `<tr><td>${esc(ep)}</td><td class="good">ไม่ fail เลย</td><td>0</td></tr>`;
    return `<tr><td>${esc(ep)}</td><td class="bad">${esc(ff.stageLabel)} (${ff.vus} VUs)</td><td>${ff.fails}/${ff.reqs} (${f1(ff.pct)}%)</td></tr>`;
  }).join('')}</tbody></table>
</section>

<section class="card">
  <h2>ราย check</h2>
  <table><thead><tr><th>check</th><th>passes</th><th>fails</th><th>rate</th></tr></thead>
  <tbody>${checks}</tbody></table>
</section>

<section class="card">
  <h2>Config ที่ทดสอบ</h2>
  <table><thead><tr><th>option</th><th>value</th></tr></thead><tbody>${config}</tbody></table>
</section>

<section class="card"><h2>วิธีรันซ้ำ + วิเคราะห์ลึก (timeline)</h2>
<pre><code>${esc(rerun)}</code></pre>
</section>

<script>
new Chart(document.getElementById('failChart'), { type: 'bar',
  data: { labels: ${JSON.stringify(stages.map((s) => `${s.vus} VUs`))},
    datasets: [{ label: 'failed %', data: ${JSON.stringify(failedPerStage.map((s) => +s.pct.toFixed(2)))}, backgroundColor: '#e05353' }] },
  options: { responsive: true, scales: { y: { title: { display: true, text: '%' }, beginAtZero: true } } }
});
</script></body></html>`;
}
