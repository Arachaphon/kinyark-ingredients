#!/usr/bin/env python
"""รวมผล k6 raw JSON (--out json=...) เป็น bucket ตามเวลา (ไทม์ไลน์).

ใช้ stdlib ล้วน (ไม่ต้องติดตั้งอะไรเพิ่ม):

    python tests/k6/analyze_timeline.py tests/k6/raw.json --bucket 10 --out tests/k6/timeline.json
    python tests/k6/analyze_timeline.py tests/k6/raw.json --bucket 10 --per-api search-ingredients-kai

แต่ละ bucket เก็บ: ช่วงวินาที, VUs โดยประมาณ (เฉลี่ยจาก metric vus),
count, avg, p95, max, fail%% (status != 200), slow%% (>800ms, เสริม)

ดีฟอลต์พิมพ์ตารางรวม (1 แถวต่อ bucket) — ถ้าจะดูแยก API ใช้ --per-api
(ใส่ชื่อ endpoint) หรือ --per-api all (ทุก API รวม 6 เท่าแถว)
"""

import argparse
import json
import re
import sys
from datetime import datetime, timezone

# Windows console (cp1252/cp874) พิมพ์ภาษาไทยแล้ว crash → บังคับ UTF-8
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

TS_RE = re.compile(
    r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:?\d{2})?"
)


def parse_time(s):
    """Parse ISO8601 แบบทนเศษวินาทีเกิน 6 หลัก (k6 ให้มา 7 หลักบน Windows)."""
    m = TS_RE.match(s)
    if not m:
        raise ValueError("bad timestamp: %r" % s)
    base, frac, tz = m.groups()
    dt = datetime.strptime(base, "%Y-%m-%dT%H:%M:%S")
    if frac:
        dt = dt.replace(microsecond=int((frac + "000000")[:6]))
    if tz in (None, ""):
        tzinfo = None
    elif tz == "Z":
        tzinfo = timezone.utc
    else:
        tz = tz.replace(":", "")
        sign = 1 if tz[0] == "+" else -1
        from datetime import timedelta

        tzinfo = timezone(
            sign * timedelta(hours=int(tz[1:3]), minutes=int(tz[3:5]))
        )
    return dt.replace(tzinfo=tzinfo)


def percentile(sorted_vals, p):
    """p in [0,100], linear interpolation (เหมือน k6 โดยประมาณ)."""
    if not sorted_vals:
        return None
    if len(sorted_vals) == 1:
        return float(sorted_vals[0])
    k = (len(sorted_vals) - 1) * (p / 100.0)
    lo = int(k)
    hi = min(lo + 1, len(sorted_vals) - 1)
    frac = k - lo
    return sorted_vals[lo] + (sorted_vals[hi] - sorted_vals[lo]) * frac


def summarize(items):
    """items = list of (duration, status) -> dict สรุป."""
    if not items:
        return {"count": 0, "avg_ms": None, "p95_ms": None, "max_ms": None,
                "fail_count": 0, "fail_pct": 0.0, "slow_pct": 0.0}
    durs = sorted(v for v, _ in items)
    fails = sum(1 for _, s in items if s != 200)
    slows = sum(1 for v, _ in items if v > 800)
    cnt = len(durs)
    return {"count": cnt, "avg_ms": round(sum(durs) / cnt, 1),
            "p95_ms": round(percentile(durs, 95), 1),
            "max_ms": round(durs[-1], 1), "fail_count": fails,
            "fail_pct": round(fails / cnt * 100, 2),
            "slow_pct": round(slows / cnt * 100, 2)}


def main():
    ap = argparse.ArgumentParser(description="k6 raw JSON -> timeline buckets")
    ap.add_argument("raw", help="ไฟล์ raw JSON Lines จาก k6 --out json=")
    ap.add_argument("--out", default=None, help="เขียนผลเป็น JSON ไฟล์นี้")
    ap.add_argument("--bucket", type=float, default=10.0,
                    help="ความกว้างแต่ละ bucket (วินาที, default 10)")
    ap.add_argument("--per-api", default=None, metavar="ENDPOINT",
                    help="พิมพ์แยก API ด้วย (ใส่ชื่อ endpoint หรือ all)")
    args = ap.parse_args()

    reqs = []   # (t, duration, status, endpoint)
    vus_pts = []  # (t, vus)
    with open(args.raw, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                o = json.loads(line)
            except json.JSONDecodeError:
                continue
            if o.get("type") != "Point":
                continue
            d = o.get("data", {})
            tags = d.get("tags", {}) or {}
            if tags.get("group") == "::setup":
                continue  # ตัด warmup ใน setup() ออก
            try:
                t = parse_time(d["time"])
            except (KeyError, ValueError):
                continue
            if o.get("metric") == "vus":
                vus_pts.append((t, float(d["value"])))
            elif o.get("metric") == "http_req_duration":
                try:
                    status = int(str(tags.get("status", "200")))
                except ValueError:
                    status = 0
                reqs.append((t, float(d["value"]), status,
                             tags.get("endpoint") or "(untagged)"))

    if not reqs:
        print("ไม่พบ http_req_duration points (ตรวจว่าไฟล์ raw ถูกต้อง?)")
        return 1

    t0 = min(t for t, _, _, _ in reqs)
    last = max(t for t, _, _, _ in reqs)
    total_s = (last - t0).total_seconds()
    n = int(total_s // args.bucket) + 1

    buckets = [[] for _ in range(n)]
    for t, v, status, ep in reqs:
        idx = min(max(int((t - t0).total_seconds() // args.bucket), 0), n - 1)
        buckets[idx].append((v, status, ep))

    vus_avg = []
    for i in range(n):
        lo = i * args.bucket
        vals = [v for (t, v) in vus_pts
                if lo <= (t - t0).total_seconds() < lo + args.bucket]
        vus_avg.append(round(sum(vals) / len(vals), 1) if vals else None)

    endpoints = sorted({ep for _, _, _, ep in reqs})
    rows = []
    for i in range(n):
        items = [(v, s) for (v, s, _) in buckets[i]]
        s = summarize(items)
        s.update({"bucket": i + 1, "sec_from": round(i * args.bucket, 1),
                  "sec_to": round((i + 1) * args.bucket, 1),
                  "vus_avg": vus_avg[i]})
        rows.append(s)

    by_api = {}
    if args.out or (args.per_api and args.per_api != "all"):
        for ep in endpoints:
            by_api[ep] = []
            for i in range(n):
                items = [(v, s) for (v, s, e) in buckets[i] if e == ep]
                s = summarize(items)
                s.update({"bucket": i + 1,
                          "sec_from": round(i * args.bucket, 1),
                          "sec_to": round((i + 1) * args.bucket, 1)})
                by_api[ep].append(s)

    # ---------- พิมพ์ตารางรวม ----------
    print("| bucket | sec | VUs~ | reqs | avg(ms) | p95(ms) | max(ms) | fail%% | slow%% |")
    print("|---|---|---|---|---|---|---|---|---|")
    first_breach = None
    for r in rows:
        a = ("%.1f" % r["avg_ms"]) if r["avg_ms"] is not None else "-"
        p = ("%.1f" % r["p95_ms"]) if r["p95_ms"] is not None else "-"
        m = ("%.1f" % r["max_ms"]) if r["max_ms"] is not None else "-"
        v = ("%.0f" % r["vus_avg"]) if r["vus_avg"] is not None else "-"
        breached = ((r["p95_ms"] is not None and r["p95_ms"] > 800)
                    or r["fail_pct"] > 1.0)
        if breached and first_breach is None:
            first_breach = r
        print("| %d | %.0f-%.0f | %s | %d | %s | %s | %s | %.2f | %.2f |%s"
              % (r["bucket"], r["sec_from"], r["sec_to"], v, r["count"],
                 a, p, m, r["fail_pct"], r["slow_pct"],
                 " <-- BREACH" if breached else ""))

    if first_breach is not None:
        print("\nเริ่มผิดเกณฑ์ (p95>800ms หรือ fail>1%%) ที่วินาทีที่ %.0f-%.0f (VUs~%s)"
              % (first_breach["sec_from"], first_breach["sec_to"],
                 first_breach["vus_avg"]))
    else:
        print("\nไม่พบจุด breach ในทุก bucket (p95<800ms, fail<1%% ตลอดรัน)")

    # ---------- พิมพ์แยก API (ถ้าขอ) ----------
    if args.per_api:
        want = endpoints if args.per_api == "all" else [args.per_api]
        for ep in want:
            if ep not in by_api:
                print("\nไม่พบ endpoint: %s (มี: %s)" % (ep, ", ".join(endpoints)))
                continue
            print("\n--- %s ---" % ep)
            print("| bucket | sec | reqs | avg(ms) | p95(ms) | max(ms) | fail%% | slow%% |")
            for r in by_api[ep]:
                a = ("%.1f" % r["avg_ms"]) if r["avg_ms"] is not None else "-"
                p = ("%.1f" % r["p95_ms"]) if r["p95_ms"] is not None else "-"
                m = ("%.1f" % r["max_ms"]) if r["max_ms"] is not None else "-"
                print("| %d | %.0f-%.0f | %d | %s | %s | %s | %.2f | %.2f |"
                      % (r["bucket"], r["sec_from"], r["sec_to"], r["count"],
                         a, p, m, r["fail_pct"], r["slow_pct"]))

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump({"t0": t0.isoformat(), "bucket_s": args.bucket,
                       "endpoints": endpoints, "overall": rows,
                       "by_api": by_api},
                      f, indent=2)
        print("เขียน %s แล้ว" % args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
