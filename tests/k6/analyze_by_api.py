#!/usr/bin/env python
"""แยกผล k6 raw JSON (--out json=...) เป็นราย (stage x endpoint).

ใช้ stdlib ล้วน (ไม่ต้องติดตั้งอะไรเพิ่ม):

    python tests/k6/analyze_by_api.py tests/k6/raw.json --stage 30 --targets 1,10,25,50,100,0 --out tests/k6/by-api.json

สมมติฐาน: scenario stages ขั้นละ STAGE_LEN วินาที ตาม --targets
request แรก (group != ::setup) คือ t0 แล้ว bucket ตามเวลาที่ผ่านไป
(elapsed // STAGE_LEN) — หลักเดียวกับ analyze_timeline.py แต่แยกต่อ endpoint
ด้วย tag "endpoint" ที่สคริปต์เทสติดมา (tests/k6/test.js ใส่ไว้ทุก request)

นิยาม fail (ตามที่ตกลง): status != 200  (duration > 800ms แสดงเป็น
คอลัมน์เสริม slow_pct เท่านั้น ไม่นับเป็น fail)

คอลัมน์ที่ออกต่อ (stage, endpoint): count | avg | p95 | max |
fail_pct (non-200) | slow_pct (>800ms) | rps
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


def main():
    ap = argparse.ArgumentParser(description="k6 raw JSON -> per (stage x endpoint) table")
    ap.add_argument("raw", help="ไฟล์ raw JSON Lines จาก k6 --out json=")
    ap.add_argument("--out", default=None, help="เขียนผลเป็น JSON ไฟล์นี้")
    ap.add_argument("--stage", type=float, default=30.0, help="ความยาวแต่ละ stage (วินาที)")
    ap.add_argument(
        "--durations",
        default=None,
        help="ความยาวแต่ละ stage คั่นด้วย comma เช่น 10,10,15,20,30,30 (ถ้าใส่จะใช้แทน --stage — ต้องมีจำนวนเท่ากับ --targets)",
    )
    ap.add_argument(
        "--targets",
        default="1,10,25,50,100,0",
        help="VUs target ต่อ stage คั่นด้วย comma (ต้องตรงกับ stages ใน test.js)",
    )
    args = ap.parse_args()
    targets = [int(x) for x in args.targets.split(",")]
    n = len(targets)
    if args.durations:
        durations = [float(x) for x in args.durations.split(",")]
        if len(durations) != n:
            print("จำนวน --durations (%d) ต้องเท่ากับ --targets (%d)"
                  % (len(durations), n))
            return 2
        bounds = [0.0]
        for dd in durations:
            bounds.append(bounds[-1] + dd)

        def stage_of(elapsed):
            for i in range(n):
                if elapsed < bounds[i + 1]:
                    return i
            return n - 1
        stage_lens = durations
    else:
        stage_lens = [args.stage] * n

        def stage_of(elapsed):
            return min(max(int(elapsed // args.stage), 0), n - 1)

    # cells[stage_idx][endpoint] = list of (duration, status)
    cells = [dict() for _ in range(n)]
    all_pts = []

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
            if o.get("metric") != "http_req_duration":
                continue
            d = o.get("data", {})
            tags = d.get("tags", {}) or {}
            if tags.get("group") == "::setup":
                continue  # ตัด warmup ใน setup() ออก
            try:
                t = parse_time(d["time"])
            except (KeyError, ValueError):
                continue
            ep = tags.get("endpoint") or "(untagged)"
            try:
                status = int(str(tags.get("status", "200")))
            except ValueError:
                status = 0
            all_pts.append((t, float(d["value"]), status, ep))

    if not all_pts:
        print("ไม่พบ http_req_duration points (ตรวจว่าไฟล์ raw ถูกต้อง?)")
        return 1

    t0 = min(t for t, _, _, _ in all_pts)
    for t, v, status, ep in all_pts:
        idx = stage_of((t - t0).total_seconds())
        cells[idx].setdefault(ep, []).append((v, status))

    endpoints = sorted({ep for c in cells for ep in c})
    rows = []  # ต่อ (stage, endpoint)
    print("| stage | VUs | endpoint | count | avg(ms) | p95(ms) | max(ms) | fail%% (non-200) | slow%% (>800ms) | rps |")
    print("|---|---|---|---|---|---|---|---|---|---|---|")
    first_fail = {}  # endpoint -> stage แรกที่มี non-200
    for i, target in enumerate(targets):
        for ep in endpoints:
            vals = cells[i].get(ep, [])
            cnt = len(vals)
            if not cnt:
                print("| %d | %d | %s | 0 | - | - | - | - | - | - |" % (i + 1, target, ep))
                rows.append(
                    {
                        "stage": i + 1, "vus_target": target, "endpoint": ep,
                        "count": 0, "avg_ms": None, "p95_ms": None, "max_ms": None,
                        "fail_count": 0, "fail_pct": 0.0, "slow_pct": 0.0, "rps": 0.0,
                    }
                )
                continue
            durs = sorted(v for v, _ in vals)
            fails = sum(1 for _, s in vals if s != 200)
            slows = sum(1 for v, _ in vals if v > 800)
            avg = sum(durs) / cnt
            p95 = percentile(durs, 95)
            mx = durs[-1]
            fail_pct = fails / cnt * 100
            slow_pct = slows / cnt * 100
            rps = cnt / stage_lens[i]
            if fails > 0 and ep not in first_fail and target != 0:
                first_fail[ep] = {"stage": i + 1, "vus": target,
                                  "fail_pct": round(fail_pct, 2),
                                  "fail_count": fails, "count": cnt}
            flag = " <-- FAIL" if fails > 0 and target != 0 else ""
            rows.append(
                {
                    "stage": i + 1, "vus_target": target, "endpoint": ep,
                    "count": cnt, "avg_ms": round(avg, 1),
                    "p95_ms": round(p95, 1), "max_ms": round(mx, 1),
                    "fail_count": fails, "fail_pct": round(fail_pct, 2),
                    "slow_pct": round(slow_pct, 2), "rps": round(rps, 1),
                }
            )
            print(
                "| %d | %d | %s | %d | %.1f | %.1f | %.1f | %.2f (%d) | %.2f | %.1f |%s"
                % (i + 1, target, ep, cnt, avg, p95, mx,
                   fail_pct, fails, slow_pct, rps, flag)
            )

    print("\n=== fail ครั้งแรกของแต่ละ API (status != 200) ===")
    if not first_fail:
        print("ไม่มี API ไหนมี status != 200 เลยตลอดรัน (100 VUs ยังเอาอยู่ด้าน status)")
    else:
        for ep in endpoints:
            if ep in first_fail:
                ff = first_fail[ep]
                print("- %s: เริ่ม fail ที่ stage %d (%d VUs): %.2f%% (%d/%d)"
                      % (ep, ff["stage"], ff["vus"], ff["fail_pct"],
                         ff["fail_count"], ff["count"]))
            else:
                print("- %s: ไม่ fail เลย" % ep)

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(
                {"t0": t0.isoformat(), "stage_len_s": args.stage,
                 "durations": stage_lens, "targets": targets,
                 "endpoints": endpoints,
                 "rows": rows, "first_fail": first_fail},
                f, indent=2,
            )
        print("เขียน %s แล้ว" % args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
