#!/usr/bin/env python
"""แยกผล k6 raw JSON (--out json=...) เป็นราย stage (VUs level).

ใช้ stdlib ล้วน (ไม่ต้องติดตั้ง pandas):

    python k6/analyze.py outputs/k6-read-raw.json --out outputs/k6-read-by-stage.json

สมมติฐาน: scenario ramping-vus ขั้นละ STAGE_LEN วินาที ตาม targets
[10, 20, 50, 100, 200, 300, 500, 0] — request แรกของ scenario (group != ::setup)
คือ t0 แล้ว bucket ตามเวลาที่ผ่านไป (elapsed // STAGE_LEN)

คอลัมน์ที่ออก: VUs target | count | avg | p95 | p99 | error% | checks% | rps
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
        tzinfo = timezone(
            sign
            * (
                __import__("datetime").timedelta(
                    hours=int(tz[1:3]), minutes=int(tz[3:5])
                )
            )
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


def main():
    ap = argparse.ArgumentParser(description="k6 raw JSON -> per-stage table")
    ap.add_argument("raw", help="ไฟล์ raw JSON Lines จาก k6 --out json=")
    ap.add_argument("--out", default=None, help="เขียนผลเป็น JSON ไฟล์นี้")
    ap.add_argument("--stage", type=float, default=30.0, help="ความยาวแต่ละ stage (วินาที)")
    ap.add_argument(
        "--targets",
        default="10,20,50,100,200,300,500,0",
        help="VUs target ต่อ stage คั่นด้วย comma",
    )
    args = ap.parse_args()
    targets = [int(x) for x in args.targets.split(",")]

    durations = []  # (t, value)
    failed = []     # (t, 0/1)
    checks = []     # (t, 0/1)

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
            metric = o.get("metric")
            if metric == "http_req_duration":
                durations.append((t, float(d["value"])))
            elif metric == "http_req_failed":
                failed.append((t, float(d["value"])))
            elif metric == "checks":
                checks.append((t, float(d["value"])))

    if not durations:
        print("ไม่พบ http_req_duration points (ตรวจว่าไฟล์ raw ถูกต้อง?)")
        return 1

    t0 = min(t for t, _ in durations)
    n = len(targets)
    buckets = [[] for _ in range(n)]
    for t, v in durations:
        idx = int((t - t0).total_seconds() // args.stage)
        buckets[min(max(idx, 0), n - 1)].append(v)
    fbuckets = [[] for _ in range(n)]
    for t, v in failed:
        idx = int((t - t0).total_seconds() // args.stage)
        fbuckets[min(max(idx, 0), n - 1)].append(v)
    cbuckets = [[] for _ in range(n)]
    for t, v in checks:
        idx = int((t - t0).total_seconds() // args.stage)
        cbuckets[min(max(idx, 0), n - 1)].append(v)

    rows = []
    print("| stage | VUs target | count | avg(ms) | p95(ms) | p99(ms) | error%% | checks%% | rps |")
    print("|---|---|---|---|---|---|---|---|---|")
    first_break = None
    for i, target in enumerate(targets):
        vals = sorted(buckets[i])
        cnt = len(vals)
        avg = sum(vals) / cnt if cnt else None
        p95 = percentile(vals, 95)
        p99 = percentile(vals, 99)
        ferr = (sum(fbuckets[i]) / len(fbuckets[i]) * 100) if fbuckets[i] else 0.0
        cpass = (sum(cbuckets[i]) / len(cbuckets[i]) * 100) if cbuckets[i] else None
        rps = cnt / args.stage if cnt else 0.0
        broke = (p95 is not None and p95 > 500) or (ferr > 1.0)
        if broke and first_break is None and target != 0:
            first_break = target
        rows.append(
            {
                "stage": i + 1,
                "vus_target": target,
                "count": cnt,
                "avg_ms": round(avg, 1) if avg is not None else None,
                "p95_ms": round(p95, 1) if p95 is not None else None,
                "p99_ms": round(p99, 1) if p99 is not None else None,
                "error_pct": round(ferr, 2),
                "checks_pct": round(cpass, 2) if cpass is not None else None,
                "rps": round(rps, 1),
                "breached": broke,
            }
        )
        print(
            "| %d | %d | %d | %s | %s | %s | %.2f | %s | %.1f |%s"
            % (
                i + 1,
                target,
                cnt,
                ("%.1f" % avg) if avg is not None else "-",
                ("%.1f" % p95) if p95 is not None else "-",
                ("%.1f" % p99) if p99 is not None else "-",
                ferr,
                ("%.2f" % cpass) if cpass is not None else "-",
                rps,
                " <-- BREACH" if broke and target != 0 else "",
            )
        )

    if first_break is not None:
        print("\nจุดที่ performance เริ่มตก (p95>500ms หรือ error>1%% ครั้งแรก): %d VUs" % first_break)
    else:
        print("\nไม่พบจุด breach ในทุก stage")

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump({"t0": t0.isoformat(), "stage_len_s": args.stage, "rows": rows}, f, indent=2)
        print("เขียน %s แล้ว" % args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
