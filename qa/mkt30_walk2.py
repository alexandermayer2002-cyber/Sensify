"""Scout 2026-10-30 take 2: navigate tabs via .mk-menu-link at 430px."""
from robot import Robot
import json, os
r = Robot("MK30B")
report = {"tabs": {}, "shots": [], "overflow": {}, "console": []}
try:
    r.goto(); r.sleep(3.0)
    for tab, label in [("home",None), ("how","How it works"), ("science","Science"),
                       ("pricing","Pricing"), ("faq","FAQ"), ("about","About")]:
        if label:
            r.page.locator(".mk-menu-btn").click(); r.sleep(0.5)
            r.page.locator(".mk-menu-link", has_text=label).first.click(); r.sleep(1.5)
        r.page.evaluate("window.scrollTo(0,0)"); r.sleep(0.8)
        report["tabs"][tab] = r.page.inner_text("body")
        report["overflow"][tab] = r.page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
        h = r.page.evaluate("() => document.body.scrollHeight")
        n = min(7, max(1, h // 900))
        for i in range(n + 1):
            r.page.evaluate(f"window.scrollTo(0, {i} * (document.body.scrollHeight - 900) / {max(n,1)})")
            r.sleep(1.0)
            report["shots"].append(r.shot(f"{tab}_s{i}"))
    report["console"] = r.console[:20]
finally:
    with open("mkt30b_report.json", "w") as f:
        json.dump(report, f, indent=1)
    r.close()
print("done; console:", len(report["console"]))
